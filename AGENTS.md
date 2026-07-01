# Marketplace — Agent Instructions

Proyecto de portafolio fullstack: tienda genérica con admin único y checkout simulado (sin pasarela de pago real). Lee este archivo completo antes de tocar cualquier código.

---

## Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Monorepo | Turborepo + pnpm workspaces | turbo latest |
| Frontend | Next.js (App Router) | 16.x |
| Frontend UI | TailwindCSS v4, shadcn/ui | — |
| Frontend auth | Auth.js v5 | — |
| Frontend data | TanStack Query + React Hook Form + Zod | — |
| Backend | Express + TypeScript | Express 4.x, TS 5.x |
| Backend arch | Clean Architecture (4 capas) | — |
| Validación | Zod (compartido frontend ↔ backend) | 3.x |
| ORM | Mongoose | 8.x |
| Base de datos | MongoDB 7 | — |
| Autenticación | JWT (backend) + Auth.js session (frontend) | — |
| Tipos compartidos | `@marketplace/shared` (packages/shared) | workspace |
| Tests | Jest + Supertest + mongodb-memory-server | — |
| Infra local | Docker Compose | — |
| Deploy | Frontend → Vercel, Backend → Railway, DB → Atlas M0 | — |

---

## Comandos

```bash
# Desde la raíz del monorepo
pnpm dev          # arranca frontend + backend en paralelo (Turborepo)
pnpm build        # build de todos los paquetes en orden
pnpm lint         # eslint en todos los paquetes
pnpm test         # jest --runInBand en backend (tests son secuenciales por MongoDB)

# Por paquete (cuando se trabaja uno solo)
cd apps/backend && pnpm dev     # tsx watch — hot reload sin compilar
cd apps/backend && pnpm test    # jest --runInBand
cd apps/frontend && pnpm dev    # next dev en :3000

# Instalar una dep en un paquete específico
pnpm add <paquete> --filter @marketplace/backend
pnpm add <paquete> --filter frontend
```

MongoDB local para desarrollo:

```bash
docker compose up mongo -d   # solo MongoDB, el resto corre con turbo dev
docker compose up --build    # stack completo containerizado (demo)
```

---

## Estructura del Monorepo

```
marketplace/
├── apps/
│   ├── backend/src/
│   │   ├── domain/          ← Entidades puras (Product, User, Transaction) — SIN deps externas
│   │   ├── interfaces/      ← Contratos TypeScript (IProductRepository, IAuthService…)
│   │   ├── application/
│   │   │   └── use-cases/   ← Lógica de negocio — solo usa interfaces, nunca Mongoose
│   │   ├── infrastructure/
│   │   │   ├── config/      ← db.ts (connectDB / disconnectDB)
│   │   │   ├── models/      ← Mongoose schemas
│   │   │   ├── repositories/← Implementaciones concretas de interfaces
│   │   │   ├── services/    ← AuthService (JWT)
│   │   │   ├── controllers/ ← Traducen HTTP ↔ use-cases
│   │   │   └── routes/      ← Express routers, middleware de auth
│   │   ├── middleware/      ← errorHandler global
│   │   ├── app.ts           ← createApp() — factory sin listen()
│   │   └── index.ts         ← Punto de entrada: connectDB → createApp → listen
│   └── frontend/app/
│       ├── (auth)/login/    ← Login page (Auth.js v5)
│       ├── (admin)/         ← Rutas protegidas: dashboard, products, users, transactions
│       └── (store)/         ← Vitrina pública + [slug] detalle + checkout modal
└── packages/
    └── shared/src/
        ├── types/           ← Interfaces TypeScript (IProduct, IUser, ITransaction)
        └── schemas/         ← Zod schemas de validación compartidos
```

---

## Arquitectura Clean — Regla Fundamental

Las dependencias **solo apuntan hacia adentro**:

```
infrastructure → application → domain
                     ↑
                 interfaces (inyectadas en use-cases)
```

- `domain/` — clases puras, cero imports externos
- `interfaces/` — contratos TypeScript sin implementación
- `application/use-cases/` — reciben interfaces por constructor, nunca importan Mongoose
- `infrastructure/` — única capa que conoce Express, Mongoose, JWT, bcrypt

**Tests de use-cases** usan repos falsos que implementan las interfaces — no necesitan MongoDB real. Solo los tests de repositorios/integración usan `mongodb-memory-server`.

---

## API REST

| Método | Ruta | Auth |
|---|---|---|
| POST | `/api/auth/login` | pública |
| GET | `/api/auth/me` | Bearer token |
| GET | `/api/products` | pública |
| GET | `/api/products/:slug` | pública |
| POST/PUT/DELETE | `/api/products` | admin |
| GET/POST/PUT/DELETE | `/api/users` | admin |
| GET | `/api/transactions` | admin |
| POST | `/api/transactions` | pública (checkout) |
| PATCH | `/api/transactions/:id/status` | admin |
| GET | `/health` | pública |

Convenciones: paginación con `?page=1&limit=20`, DELETE de productos es siempre soft delete (`active: false`), rutas admin requieren `Authorization: Bearer <token>`.

---

## Variables de Entorno

### `apps/backend/.env`
```
MONGODB_URI=mongodb://localhost:27017/marketplace
JWT_SECRET=<secreto_largo_aleatorio>
PORT=4000
FRONTEND_URL=http://localhost:3000
```

### `apps/frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:4000
AUTH_SECRET=<secreto_auth_js>
```

---

## Tipos Compartidos (`@marketplace/shared`)

Importar siempre desde el paquete, no duplicar tipos:

```ts
import type { IProduct, IUser, ITransaction } from '@marketplace/shared'
import { createProductSchema, loginSchema } from '@marketplace/shared'
```

El paquete se resuelve automáticamente vía pnpm workspaces (`workspace:*`) — no requiere publicación.

---

## Restricciones — No Hacer

- **No importar Mongoose en `domain/` ni `application/`** — rompe Clean Architecture
- **No agregar lógica de negocio en controllers** — los controllers solo traducen HTTP ↔ use-case
- **No hardcodear `localhost:4000`** en el frontend — usar `NEXT_PUBLIC_API_URL`
- **No commitear `.env`** ni `.env.local` — solo `.env.example`
- **No correr `turbo run lint` en PowerShell desde raíz** — bug conocido con shim de npm en Windows; correr lint por paquete (`cd apps/backend && pnpm lint`)
- **No modificar archivos en `packages/shared/src`** sin actualizar el barrel export en `index.ts`
- **No usar `any` en TypeScript** — el repo es estricto

---

## Flujo de Desarrollo (SDD)

Este proyecto usa Subagent-Driven Development. Cada task del plan:

1. Se ejecuta en un agente fresco con el plan como contexto
2. Se commitea al terminar
3. Se revisa en el agente principal antes de marcar como completada

Plan activo: `docs/superpowers/plans/2026-06-24-marketplace-clean-architecture.md`  
Ledger de progreso: `.git/sdd/progress.md`  
Base commit (Task 4 en adelante): `9d6c38b`

---

## Contexto de Negocio

- Admin único — no hay registro de usuarios desde la tienda (solo el admin crea cuentas)
- Checkout simulado — no hay pasarela de pago; `POST /api/transactions` genera un número de orden
- Los precios en transacciones son snapshots — no se actualizan si el producto cambia
- Soft delete en productos (`active: false`) — las transacciones históricas mantienen coherencia
