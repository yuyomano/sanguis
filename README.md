# Sanguis — Plataforma de Banco de Sangre

Plataforma completa de gestión de donación de sangre. Cubre el ciclo completo: donantes → eventos de donación → testing de viabilidad → almacenamiento (sangre/plaquetas/plasma) → última milla → uso final.

## Estructura

```
sanguis/
├── api/       # Backend NestJS (TypeScript) + Prisma + PostgreSQL
├── web/       # Panel de administración Next.js 14
├── mobile/    # App donantes Flutter (iOS + Android)
└── docker-compose.yml
```

## Inicio rápido (desarrollo)

### Prerequisitos
- Docker Desktop
- Node.js 20+
- Flutter 3.x (solo para mobile)

### 1. Levantar infraestructura

```bash
docker-compose up postgres redis -d
```

### 2. API

```bash
cd api
npm install
npx prisma migrate dev
npm run start:dev
# Corre en http://localhost:3001
# Swagger: http://localhost:3001/api/docs
```

### 3. Web Admin

```bash
cd web
npm install
npm run dev
# Corre en http://localhost:3000
```

### 4. Mobile

```bash
cd mobile
flutter pub get
flutter run
```

## Variables de entorno

Copiar `.env.example` a `.env` en cada carpeta y completar los valores.

## Módulos principales

| Módulo | Descripción |
|---|---|
| Auth | JWT + refresh tokens, RBAC |
| Donors | Perfil, elegibilidad, categorías VIP/Recurrente/Casual |
| Blood Units | Inventario sangre/plaquetas/plasma, ciclo de vida |
| Testing | Workflow de análisis lab propio y externo |
| Events | Eventos fijos y camión móvil, citas con QR |
| Logistics | Flota propia + terceros, cadena de custodia, costos |
| Rewards | Puntos, establecimientos aliados, deducciones fiscales |
| Notifications | WhatsApp Business API, SendGrid, FCM |
| Finance | Costos vs ingresos, facturación, reportes |
