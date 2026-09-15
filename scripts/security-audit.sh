#!/usr/bin/env bash
# Auditoría de seguridad rápida para Sanguis (api/web/mobile).
# No modifica nada — solo reporta. Ejecutar desde la raíz del repo:
#   bash scripts/security-audit.sh
#
# ponytail: checks basados en grep/heurística, no un SAST real — pensado para
# correr antes de cada deploy, no reemplaza una revisión manual ni `npm audit`
# en CI. Subir a herramienta dedicada (Snyk/Semgrep) si esto deja de alcanzar.

set -uo pipefail
cd "$(dirname "$0")/.."
FAIL=0
warn() { echo "  ⚠️  $1"; FAIL=1; }
ok()   { echo "  ✅ $1"; }

echo "== 1) Dependencias vulnerables (npm audit) =="
for dir in api web mobile; do
  echo "-- $dir --"
  (cd "$dir" && npm audit --omit=dev 2>&1 | tail -n 15)
done

echo ""
echo "== 2) Secretos: .env no debe estar en git =="
TRACKED_ENV=$(git ls-files | grep -E '(^|/)\.env($|\.[^.]+$)' | grep -v '\.env\.example' || true)
if [ -n "$TRACKED_ENV" ]; then
  warn ".env está trackeado en git:"
  echo "$TRACKED_ENV" | sed 's/^/      /'
else
  ok "ningún .env trackeado (fuera de .env.example)"
fi

echo ""
echo "== 3) Fuerza de JWT_SECRET / JWT_REFRESH_SECRET (api/.env) =="
if [ -f api/.env ]; then
  # ponytail: parseo de .env con grep en vez de dotenv — evita depender de
  # node_modules resuelto desde la raíz del repo.
  check_secret() {
    local name="$1" minlen="$2"
    local v
    v=$(grep -E "^${name}=" api/.env | head -1 | cut -d'=' -f2- | tr -d '"'"'"'\r')
    if [ -z "$v" ]; then warn "$name no configurada"; return; fi
    if [ "${#v}" -lt "$minlen" ] || echo "$v" | grep -qiE 'your_|_here|min_[0-9]+_chars'; then
      warn "$name débil (len=${#v})"
    else
      ok "$name (len=${#v})"
    fi
  }
  check_secret JWT_SECRET 32
  check_secret JWT_REFRESH_SECRET 32
  check_secret ENCRYPTION_KEY 64
else
  echo "  (api/.env no existe — omitido)"
fi

echo ""
echo "== 4) Secretos hardcodeados en archivos trackeados =="
PATTERN='AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|sk_live_[0-9a-zA-Z]{20,}|xox[baprs]-[0-9a-zA-Z-]{10,}'
HITS=$(git grep -InE "$PATTERN" -- . ':!scripts/security-audit.sh' ':!*.env.example' 2>/dev/null || true)
if [ -n "$HITS" ]; then
  warn "posibles secretos hardcodeados:"
  echo "$HITS" | sed 's/^/      /'
else
  ok "sin patrones de secretos conocidos en archivos trackeados"
fi

echo ""
echo "== 5) Endpoints admin sin @Roles (solo JwtAuthGuard) =="
echo "  (informativo — revisar a mano si el módulo debería restringir por rol)"
for f in api/src/modules/*/[a-z]*.controller.ts; do
  [ -f "$f" ] || continue
  if grep -q "JwtAuthGuard" "$f" && ! grep -q "RolesGuard" "$f"; then
    echo "  - $f"
  fi
done

echo ""
echo "== 6) Queries a Donor/AdminUser sin 'select' (riesgo de exponer passwordHash) =="
git grep -InE '\.(donor|adminUser)\.(findMany|findUnique|findFirst|create|update)\(' -- api/src \
  | while IFS=: read -r file line rest; do
      # ponytail: heurística de una línea — no valida bloques multilínea con 'select' más abajo.
      echo "  - $file:$line"
    done
echo "  (revisar cada uno: ¿el objeto devuelto incluye passwordHash al cliente?)"

echo ""
echo "== 7) main.ts: headers de seguridad presentes =="
for pattern in "helmet(" "hsts" "enableCors" "ValidationPipe"; do
  if grep -q "$pattern" api/src/main.ts; then
    ok "'$pattern' presente en main.ts"
  else
    warn "'$pattern' NO encontrado en main.ts"
  fi
done

echo ""
if [ "$FAIL" -eq 1 ]; then
  echo "Auditoría completada con advertencias (ver ⚠️ arriba)."
else
  echo "Auditoría completada sin advertencias automáticas."
fi
