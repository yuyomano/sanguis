# CLAUDE.md

Guía para trabajar en **Sanguis**, plataforma de banco de sangre (República Dominicana + LatAm).
Cubre el ciclo: donantes → eventos → testing de viabilidad → almacenamiento → logística de última milla → uso final, más fidelización por puntos y reportería regulatoria (SESPAS, cadena de frío).

## Monorepo

Tres proyectos **independientes** (sin workspaces, sin lockfile raíz). Cada uno se instala y ejecuta por separado.

```
api/      NestJS 10 + Prisma 5 + PostgreSQL 16 + Redis/Bull   → http://localhost:3001  (Swagger: /api/docs)
web/      Next.js 14 App Router + Tailwind + Radix + TanStack  → http://localhost:3000
mobile/   Expo ~54 / React Native 0.81 (React 19) + Zustand   → expo start
docker-compose.yml   postgres + redis + api + web (dev)
```

Gestor de paquetes: **npm** (hay `package-lock.json` en cada carpeta). No usar pnpm/yarn.

## Comandos

### Infraestructura
```bash
docker-compose up postgres redis -d     # solo BD + cache
docker-compose up                        # todo el stack (api + web incluidos)
```

### api/
```bash
cd api
npm install
npx prisma migrate dev                    # aplica migraciones + regenera cliente
npx prisma generate                       # solo regenera el cliente Prisma
npm run seed                               # carga datos de ejemplo (prisma/seed.ts)
npm run start:dev                          # NestJS en watch, puerto 3001
npm run build && npm start                # producción
npm test                                   # Jest (unit)  — aún sin specs
npm run test:e2e                           # Jest e2e (test/jest-e2e.json)
npm run lint                               # eslint  (nota: falta .eslintrc, hay que añadirlo)
```

Tras editar `prisma/schema.prisma`: `npx prisma migrate dev --name <cambio>` y commitear la migración generada.

### web/
```bash
cd web
npm install
npm run dev            # puerto 3000
npm run build
npm run lint           # next lint
```

### mobile/
```bash
cd mobile
npm install
npm start              # expo start (QR / dev client)
npm run android        # o npm run ios
```
No hay `tsc`/tests configurados en mobile; el chequeo de tipos va por el editor (`tsconfig.json` presente).

## Variables de entorno

Copiar `api/.env.example` → `api/.env`. Para web y mobile no hay `.env.example`: crear a mano.

| Carpeta | Archivo | Claves relevantes |
|---|---|---|
| api | `.env` | `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY` (64 hex), `WHATSAPP_*`, `SENDGRID_*`, `FIREBASE_*`, `R2_*`, `GOOGLE_MAPS_API_KEY` |
| web | `.env.local` | `NEXT_PUBLIC_API_URL=http://localhost:3001` |
| mobile | `.env` | `EXPO_PUBLIC_API_URL` (emulador Android: `http://10.0.2.2:3001`) |

Las integraciones (WhatsApp Cloud API, SendGrid, FCM, R2) están implementadas con HTTP real y **degradan a no-op** si faltan las credenciales — no fallan.

## Arquitectura

### api/ — NestJS modular
- `src/main.ts` — bootstrap: Helmet + CSP, HSTS y redirect HTTP→HTTPS solo en producción, CORS (abierto en dev, `ALLOWED_ORIGINS` en prod), `ValidationPipe` global (`whitelist` + `forbidNonWhitelisted` + `transform`), Swagger solo en dev.
- `src/app.module.ts` — registra los 10 módulos + `ThrottlerGuard` global (100 req/min general, 10/5min en auth).
- `src/common/`
  - `prisma/` — `PrismaService` (inyectable, único acceso a BD).
  - `services/encryption.service.ts` — AES-256-GCM para campos sensibles de donante (`adminNotes`, `fcmToken`). Cifrar al escribir, descifrar en el service antes de devolver.
  - `guards/` — `JwtAuthGuard` (admin) y `DonorJwtAuthGuard` (app móvil) son estrategias **separadas**; `RolesGuard` + `@Roles()` para RBAC de admin.
- `src/modules/<nombre>/` — cada módulo: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`. Módulos: `auth`, `donors`, `blood-units`, `testing`, `events`, `logistics`, `rewards`, `notifications`, `finance`, `reports`.
- `notifications/` tiene sub-servicios: `whatsapp.service.ts`, `email.service.ts` (SendGrid), `fcm.service.ts` (firebase-admin v14, imports modulares `firebase-admin/app` + `firebase-admin/messaging`).
- **Regla:** los controllers no tocan Prisma; toda la lógica y el acceso a BD viven en el service. DTOs con `class-validator`. Enums desde `@prisma/client`.

### Prisma
`api/prisma/schema.prisma` — 24 modelos, 18 enums. Entidades núcleo: `Donor`, `BloodUnit` (+`StorageLocation`), `TestResult` (+`ExternalLab`), `DonationEvent` (+`Appointment`), `DeliveryOrder` (+`Protocol`/`Item`/`Vehicle`), `PointTransaction`/`Redemption`/`PartnerEstablishment`, `Notification` (+`Template`), `FinancialRecord`, `Badge`/`DonorBadge`, `TemperatureLog`, `RefreshToken`, `EmergencyAlert`.
- `Donor` incluye `birthDate` (aviso de elegibilidad 18-65, la valida el personal clínico), `allergies` (`String[]`) y `medicalExclusions` (`MedicalExclusion[]`, enum estructurado con criterios de exclusión OMS/AABB adaptados a SESPAS — Hepatitis B/C, VIH, Chagas, etc.). Solo se exponen en el admin web (create/edit de donante); en móvil el donante no los auto-reporta todavía.
- `Donor` solo se puede eliminar (`DELETE /donors/:id`) si no tiene historial asociado (`BloodUnit`, `Appointment`, `PointTransaction`, `Redemption`, `Notification`, `ExternalDonation`, `DonorBadge`, referidos); si tiene, la API responde 409. En la práctica esto limita el borrado a donantes recién creados por error.

### web/ — Next.js App Router
- `app/(auth)/login/` público; `app/(dashboard)/*` protegido. ~13 secciones: dashboard, donors, inventory, testing, events, logistics, rewards, notifications, finance, reports, settings.
- **Sin cliente HTTP compartido**: cada página es `'use client'` y hace `fetch(\`${process.env.NEXT_PUBLIC_API_URL}/...\`, { headers: { Authorization: \`Bearer ${token}\` } })`.
- Token JWT en `localStorage`: `sanguis_token` (access) y `sanguis_refresh`.
- `lib/fmt.ts` — `fmtDOP` (moneda dominicana; 1 punto = 1 DOP en canjes).

### mobile/ — Expo React Native
- Entry `App.tsx` → `src/navigation/index.tsx` (React Navigation: stack + bottom tabs; el stack cambia según auth).
- `src/services/api.ts` — instancia `axios` **con interceptores**: adjunta token y auto-refresh en 401 con cola de peticiones concurrentes. Aquí SÍ hay cliente compartido (a diferencia de web).
- `src/store/` — Zustand: `authStore`, `donorStore`.
- Tokens en `expo-secure-store`: `sanguis_token`, `sanguis_refresh_token`, `sanguis_donor_id`.
- 12 pantallas en `src/screens/<feature>/`.

## Estilo de código

### General
- TypeScript en todo. Indentación 2 espacios.
- **API**: punto y coma sí, comillas simples. **web/mobile**: sin punto y coma, comillas simples.
- No hay Prettier/ESLint configurado en la práctica — seguir el estilo del archivo vecino.

### React (web + mobile)
- Enums del backend **siempre** se traducen con mapas estáticos: `STATUS_LABELS`, `CATEGORY_LABELS`, `BLOOD_LABELS`, `PRODUCT_LABELS`, etc. Nunca mostrar el valor crudo del enum.
- Estilos por estado/categoría: mapas estáticos `*_STYLES` / `CARD_STYLES`. **Prohibido Tailwind dinámico** (`bg-${x}`) — el JIT no lo detecta.
- Loading en tablas: componente `SkeletonRows` con `animate-pulse`.
- Tablas: `overflow-x-auto` en el contenedor + `min-w-[...]` en la `<table>`.
- Confirmaciones destructivas: estado inline (`confirmId` / `confirmBroadcast`), **nunca** `window.confirm()`.
- Moneda: `fmtDOP` (web `lib/fmt.ts`).

### NestJS
- Controller delgado → service con la lógica. Prisma solo en services.
- Excepciones: `NotFoundException`, `ConflictException`, `BadRequestException` con mensaje en español (llega al usuario final).
- `@ApiTags` / `@ApiOperation` / `@ApiBearerAuth` en cada endpoint (alimentan Swagger).
- Elegibilidad de donación: `ELIGIBILITY_DAYS` por `ProductType` (WHOLE_BLOOD 56, PLATELETS 2, PLASMA 7).

## Modelo de negocio (reglas que afectan al código)

- Moneda principal DOP, soporte USD. 1 punto = 1 DOP.
- Categorías de donante: `CASUAL` (<3 donaciones/año), `RECURRENT` (3–5), `VIP` (>5 o manual).
- `Redemption` usa el campo `redeemedAt` (no `createdAt`).
- `PartnerEstablishment.availableRewards` es `Json?` → `[{ name, points }]`.
- `CarrierType`: `OWN` | `THIRD_PARTY`.
- Compatibilidad: glóbulos rojos = ABO+Rh estricto (O- donante universal); plasma = reglas ABO invertidas (AB donante universal); plaquetas = ABO+Rh idéntico, estricto en mujeres en edad fértil, siempre "urgencia alta" (vida útil 5–7 días).
- Convocatoria de emergencia: `notificaciones = donantes_requeridos / tasa_conversión` (tasa 0.10–0.15). Rh−: triplicar el radio de búsqueda.

## Gotchas / deuda conocida

- **Deriva de migraciones Prisma**: histórico tuvo tramos donde el schema creció sin generar migraciones (queda al menos un salto grande entre el init y la primera migración posterior). Al tocar el schema, generar siempre la migración correspondiente (`npx prisma migrate dev --name <cambio>`, o si el entorno no soporta prompts interactivos: `prisma migrate diff --from-url $DATABASE_URL --to-schema-datamodel ./prisma/schema.prisma --script` → crear manualmente `prisma/migrations/<timestamp>_<nombre>/migration.sql` → `prisma migrate deploy`).
- **Restos de Flutter**: `mobile/lib/**` (`.dart`), `pubspec.yaml`, `pubspec.lock`, `analysis_options.yaml`, `sanguis.iml` son código muerto tras la migración a Expo (commit `a2fe89f`). El código vivo es `mobile/src/`.
- **README desactualizado**: describe mobile como Flutter y puertos que no coinciden.
- Puerto por defecto obsoleto: `mobile/src/services/api.ts` cae en `:3101` si falta `EXPO_PUBLIC_API_URL`; el real es `:3001`.
- Sin cobertura de tests. Jest está configurado en api pero no hay specs.
- `api/npm run lint` falla: no hay `.eslintrc`.
- **Fechas `"YYYY-MM-DD"` y zona horaria**: `new Date("YYYY-MM-DD")` se interpreta como medianoche UTC y se muestra un día atrás en horario local (RD es UTC-4). Al recibir una fecha de un DTO/formulario, anclar a medianoche local (`` `${dateStr}T00:00:00.000` ``) antes de guardarla o de usarla en un `new Date(...)` — tanto en el backend (Prisma `DateTime`) como en updates optimistas del estado en el frontend.

## Pendientes de producto

- Punto de venta para socios (redención en tiempo real desde app de socio).
- Deploy a producción (Railway / AWS ECS vía Docker).
- Configurar credenciales reales de WhatsApp / SendGrid / FCM / R2 y probar envíos end-to-end.
