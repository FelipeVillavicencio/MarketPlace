# Marketplace Portfolio — Design Document

**Date:** 2026-06-19  
**Status:** Approved

---

## Overview

Tienda de artículos genérica construida como proyecto de portafolio. Admin único, transacciones simuladas sin pasarela de pago real. Demuestra arquitectura fullstack moderna con frontend y backend separados, tipos compartidos y containerización completa.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15 (App Router), Auth.js v5, TailwindCSS, shadcn/ui |
| Backend | Express + TypeScript, Mongoose, Zod, Morgan |
| Base de datos | MongoDB 7 |
| Tipos compartidos | Turborepo `packages/shared` |
| Infra | Docker Compose, Turborepo |
| Validación | Zod (compartido entre frontend y backend) |
| Fetching | TanStack Query |
| Formularios | React Hook Form + Zod |

---

## Estructura del Proyecto

```
marketplace/
├── apps/
│   ├── frontend/
│   │   └── app/
│   │       ├── (auth)/login/
│   │       ├── (admin)/
│   │       │   ├── dashboard/
│   │       │   ├── products/
│   │       │   ├── users/
│   │       │   └── transactions/
│   │       └── (store)/
│   │           ├── page.tsx
│   │           └── [slug]/
│   └── backend/
│       └── src/
│           ├── routes/
│           │   ├── products.ts
│           │   ├── users.ts
│           │   └── transactions.ts
│           ├── models/
│           ├── middleware/
│           └── index.ts
├── packages/
│   └── shared/
│       └── src/
│           ├── types/product.ts
│           ├── types/user.ts
│           └── types/transaction.ts
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## Modelo de Datos (MongoDB)

### `users`
```ts
{
  _id: ObjectId,
  name: string,
  email: string,          // único
  passwordHash: string,
  role: "admin" | "customer",
  createdAt: Date,
  updatedAt: Date
}
```

### `products`
```ts
{
  _id: ObjectId,
  name: string,
  slug: string,           // único, URL amigable
  description: string,
  price: number,
  stock: number,
  category: string,
  attributes: Record<string, string>,  // genérico y flexible
  images: string[],
  active: boolean,        // soft delete
  createdAt: Date,
  updatedAt: Date
}
```

### `transactions`
```ts
{
  _id: ObjectId,
  orderNumber: string,    // ej: "ORD-2026-0001"
  customer: {             // embedded snapshot
    name: string,
    email: string
  },
  items: [
    {
      productId: ObjectId,
      name: string,       // snapshot al momento de compra
      price: number,      // snapshot al momento de compra
      quantity: number
    }
  ],
  total: number,
  status: "pending" | "paid" | "cancelled",
  createdAt: Date
}
```

---

## API REST

### Autenticación
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Productos
```
GET    /api/products              ← público (filtros: category, search, page)
GET    /api/products/:slug        ← público
POST   /api/products              ← [admin]
PUT    /api/products/:id          ← [admin]
DELETE /api/products/:id          ← [admin] soft delete
```

### Usuarios
```
GET    /api/users                 ← [admin]
POST   /api/users                 ← [admin]
PUT    /api/users/:id             ← [admin]
DELETE /api/users/:id             ← [admin]
```

### Transacciones
```
GET    /api/transactions                    ← [admin] (filtros: status, fecha)
GET    /api/transactions/:id                ← [admin]
POST   /api/transactions                    ← público (checkout simulado)
PATCH  /api/transactions/:id/status         ← [admin]
```

**Convenciones:**
- Rutas `[admin]` requieren `Authorization: Bearer <token>`
- Paginación con `?page=1&limit=20`
- DELETE de productos es siempre soft delete (`active: false`)

---

## Frontend — Rutas

### Públicas
```
/                        ← vitrina: listado con búsqueda y filtro
/products/[slug]         ← detalle + modal checkout simulado
```

### Protegidas (Auth.js v5)
```
/login
/admin                   ← dashboard con métricas
/admin/products          ← tabla CRUD
/admin/products/new
/admin/products/[id]
/admin/users             ← tabla CRUD
/admin/users/new
/admin/transactions      ← tabla + cambio de status
```

### Flujo de checkout simulado
1. Cliente ingresa nombre + email en modal
2. `POST /api/transactions` con items del carrito
3. Respuesta muestra número de orden generado

---

## Infraestructura Docker

```yaml
services:
  mongo:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: [mongo_data:/data/db]

  backend:
    build: ./apps/backend
    ports: ["4000:4000"]
    environment:
      - MONGODB_URI=mongodb://mongo:27017/marketplace
      - JWT_SECRET=...
    depends_on: [mongo]

  frontend:
    build: ./apps/frontend
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:4000
      - AUTH_SECRET=...
    depends_on: [backend]

volumes:
  mongo_data:
```

### Modos de ejecución
```bash
# Desarrollo local (recomendado)
docker compose up mongo -d
turbo dev

# Demo completo containerizado
docker compose up --build
```

### Variables de entorno
- `apps/backend/.env` → `MONGODB_URI`, `JWT_SECRET`, `PORT`
- `apps/frontend/.env.local` → `NEXT_PUBLIC_API_URL`, `AUTH_SECRET`
