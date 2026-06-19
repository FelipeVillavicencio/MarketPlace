# Marketplace Portfolio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una tienda de artículos genérica fullstack como proyecto de portafolio con admin único, transacciones simuladas, y stack moderno containerizado.

**Architecture:** Monorepo Turborepo con `apps/frontend` (Next.js 15) y `apps/backend` (Express + TypeScript) separados, comunicados via REST API. Tipos y schemas Zod compartidos en `packages/shared`. Docker Compose orquesta MongoDB, backend y frontend.

**Tech Stack:** Next.js 15, Auth.js v5, TailwindCSS, shadcn/ui, TanStack Query, React Hook Form, Express, Mongoose, Zod, Jest, Supertest, mongodb-memory-server, Docker Compose, Turborepo.

## Global Constraints

- Node.js >= 20
- TypeScript strict mode en todos los packages
- MongoDB 7
- Todas las rutas `/admin/*` requieren sesión Auth.js v5 válida
- Todas las rutas `[admin]` del backend requieren header `Authorization: Bearer <token>`
- DELETE de productos siempre es soft delete (`active: false`)
- Paginación con `?page=1&limit=20` en todos los listados
- Variables de entorno nunca commiteadas — solo `.env.example`

---

## File Map

```
marketplace/
├── apps/
│   ├── frontend/
│   │   ├── app/
│   │   │   ├── (auth)/login/page.tsx
│   │   │   ├── (admin)/layout.tsx
│   │   │   ├── (admin)/dashboard/page.tsx
│   │   │   ├── (admin)/products/page.tsx
│   │   │   ├── (admin)/products/new/page.tsx
│   │   │   ├── (admin)/products/[id]/page.tsx
│   │   │   ├── (admin)/users/page.tsx
│   │   │   ├── (admin)/users/new/page.tsx
│   │   │   ├── (admin)/transactions/page.tsx
│   │   │   ├── (store)/page.tsx
│   │   │   └── (store)/[slug]/page.tsx
│   │   ├── components/
│   │   │   ├── products/ProductCard.tsx
│   │   │   ├── products/ProductForm.tsx
│   │   │   ├── products/ProductTable.tsx
│   │   │   ├── users/UserForm.tsx
│   │   │   ├── users/UserTable.tsx
│   │   │   ├── transactions/TransactionTable.tsx
│   │   │   └── transactions/CheckoutModal.tsx
│   │   ├── lib/api.ts
│   │   ├── lib/query-client.ts
│   │   ├── auth.ts
│   │   ├── middleware.ts
│   │   └── package.json
│   │
│   └── backend/
│       ├── src/
│       │   ├── models/User.ts
│       │   ├── models/Product.ts
│       │   ├── models/Transaction.ts
│       │   ├── routes/auth.ts
│       │   ├── routes/products.ts
│       │   ├── routes/users.ts
│       │   ├── routes/transactions.ts
│       │   ├── middleware/auth.ts
│       │   ├── middleware/errorHandler.ts
│       │   ├── lib/db.ts
│       │   ├── app.ts
│       │   └── index.ts
│       ├── tests/
│       │   ├── products.test.ts
│       │   ├── users.test.ts
│       │   └── transactions.test.ts
│       └── package.json
│
├── packages/shared/
│   └── src/
│       ├── types/product.ts
│       ├── types/user.ts
│       ├── types/transaction.ts
│       ├── schemas/product.ts
│       ├── schemas/user.ts
│       ├── schemas/transaction.ts
│       └── index.ts
│
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## Task 1: Monorepo Scaffold

**Files:**
- Create: `package.json` (raíz)
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `apps/frontend/` (Next.js scaffold)
- Create: `apps/backend/package.json`
- Create: `packages/shared/package.json`

**Interfaces:**
- Produces: comando `turbo dev` levanta frontend y backend en paralelo

- [ ] **Step 1: Inicializar Turborepo en la raíz**

```bash
cd C:\Users\Felipe\workspaces\marketplace
npm install turbo --save-dev
```

- [ ] **Step 2: Crear `package.json` raíz**

```json
{
  "name": "marketplace",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "latest"
  },
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

- [ ] **Step 3: Crear `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {}
  }
}
```

- [ ] **Step 4: Crear `.gitignore` raíz**

```
node_modules/
.next/
dist/
.env
.env.local
*.env
```

- [ ] **Step 5: Crear scaffold de Next.js para el frontend**

```bash
cd apps
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir no --import-alias "@/*"
```

- [ ] **Step 6: Crear `apps/backend/package.json`**

```json
{
  "name": "@marketplace/backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "express": "^4.19.0",
    "mongoose": "^8.4.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.23.0",
    "morgan": "^1.10.0",
    "cors": "^2.8.5",
    "@marketplace/shared": "*"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/morgan": "^1.9.9",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.0.0",
    "typescript": "^5.4.0",
    "tsx": "^4.11.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.12",
    "ts-jest": "^29.1.4",
    "supertest": "^7.0.0",
    "@types/supertest": "^6.0.2",
    "mongodb-memory-server": "^10.0.0"
  }
}
```

- [ ] **Step 7: Crear `apps/backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src", "tests"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 8: Crear `apps/backend/jest.config.js`**

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFilesAfterFramework: [],
}
```

- [ ] **Step 9: Crear `packages/shared/package.json`**

```json
{
  "name": "@marketplace/shared",
  "version": "1.0.0",
  "main": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "lint": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  },
  "dependencies": {
    "zod": "^3.23.0"
  }
}
```

- [ ] **Step 10: Crear `packages/shared/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true
  },
  "include": ["src"]
}
```

- [ ] **Step 11: Instalar dependencias**

```bash
cd C:\Users\Felipe\workspaces\marketplace
npm install
```

- [ ] **Step 12: Commit**

```bash
git add .
git commit -m "chore: monorepo scaffold with Turborepo"
```

---

## Task 2: Shared Types y Zod Schemas

**Files:**
- Create: `packages/shared/src/types/product.ts`
- Create: `packages/shared/src/types/user.ts`
- Create: `packages/shared/src/types/transaction.ts`
- Create: `packages/shared/src/schemas/product.ts`
- Create: `packages/shared/src/schemas/user.ts`
- Create: `packages/shared/src/schemas/transaction.ts`
- Create: `packages/shared/src/index.ts`

**Interfaces:**
- Produces: `@marketplace/shared` exporta tipos y schemas usados por backend y frontend

- [ ] **Step 1: Crear `packages/shared/src/types/user.ts`**

```ts
export type UserRole = 'admin' | 'customer'

export interface IUser {
  _id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 2: Crear `packages/shared/src/types/product.ts`**

```ts
export interface IProduct {
  _id: string
  name: string
  slug: string
  description: string
  price: number
  stock: number
  category: string
  attributes: Record<string, string>
  images: string[]
  active: boolean
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 3: Crear `packages/shared/src/types/transaction.ts`**

```ts
export type TransactionStatus = 'pending' | 'paid' | 'cancelled'

export interface ITransactionItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export interface ITransaction {
  _id: string
  orderNumber: string
  customer: {
    name: string
    email: string
  }
  items: ITransactionItem[]
  total: number
  status: TransactionStatus
  createdAt: string
}
```

- [ ] **Step 4: Crear `packages/shared/src/schemas/user.ts`**

```ts
import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['admin', 'customer']).default('customer'),
})

export const updateUserSchema = createUserSchema.partial().omit({ password: true })

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type LoginInput = z.infer<typeof loginSchema>
```

- [ ] **Step 5: Crear `packages/shared/src/schemas/product.ts`**

```ts
import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  description: z.string().min(10, 'Descripción requerida'),
  price: z.number().positive('Precio debe ser positivo'),
  stock: z.number().int().min(0, 'Stock no puede ser negativo'),
  category: z.string().min(1, 'Categoría requerida'),
  attributes: z.record(z.string()).default({}),
  images: z.array(z.string()).default([]),
  active: z.boolean().default(true),
})

export const updateProductSchema = createProductSchema.partial()

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
```

- [ ] **Step 6: Crear `packages/shared/src/schemas/transaction.ts`**

```ts
import { z } from 'zod'

export const createTransactionSchema = z.object({
  customer: z.object({
    name: z.string().min(2, 'Nombre requerido'),
    email: z.string().email('Email inválido'),
  }),
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    price: z.number().positive(),
    quantity: z.number().int().positive(),
  })).min(1, 'Se requiere al menos un item'),
})

export const updateTransactionStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'cancelled']),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionStatusInput = z.infer<typeof updateTransactionStatusSchema>
```

- [ ] **Step 7: Crear `packages/shared/src/index.ts`**

```ts
export * from './types/user'
export * from './types/product'
export * from './types/transaction'
export * from './schemas/user'
export * from './schemas/product'
export * from './schemas/transaction'
```

- [ ] **Step 8: Commit**

```bash
git add packages/shared
git commit -m "feat(shared): add types and Zod schemas"
```

---

## Task 3: Backend — Scaffold y conexión MongoDB

**Files:**
- Create: `apps/backend/src/lib/db.ts`
- Create: `apps/backend/src/middleware/errorHandler.ts`
- Create: `apps/backend/src/app.ts`
- Create: `apps/backend/src/index.ts`
- Create: `apps/backend/.env.example`

**Interfaces:**
- Produces: `createApp()` función exportada desde `app.ts` para ser usada en tests
- Consumes: variable de entorno `MONGODB_URI`, `PORT`

- [ ] **Step 1: Crear `apps/backend/src/lib/db.ts`**

```ts
import mongoose from 'mongoose'

export async function connectDB(uri: string): Promise<void> {
  await mongoose.connect(uri)
  console.log('MongoDB connected')
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect()
}
```

- [ ] **Step 2: Crear `apps/backend/src/middleware/errorHandler.ts`**

```ts
import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({ errors: err.errors })
    return
  }
  if (err instanceof Error) {
    res.status(500).json({ message: err.message })
    return
  }
  res.status(500).json({ message: 'Error interno del servidor' })
}
```

- [ ] **Step 3: Crear `apps/backend/src/app.ts`**

```ts
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { errorHandler } from './middleware/errorHandler'

export function createApp() {
  const app = express()

  app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }))
  app.use(express.json())
  app.use(morgan('dev'))

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  // routes se agregan en tasks siguientes
  app.use(errorHandler)

  return app
}
```

- [ ] **Step 4: Crear `apps/backend/src/index.ts`**

```ts
import 'dotenv/config'
import { createApp } from './app'
import { connectDB } from './lib/db'

const PORT = process.env.PORT || 4000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace'

async function main() {
  await connectDB(MONGODB_URI)
  const app = createApp()
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`)
  })
}

main().catch(console.error)
```

- [ ] **Step 5: Crear `apps/backend/.env.example`**

```
MONGODB_URI=mongodb://localhost:27017/marketplace
JWT_SECRET=change_this_secret
PORT=4000
FRONTEND_URL=http://localhost:3000
```

- [ ] **Step 6: Instalar dotenv**

```bash
cd apps/backend
npm install dotenv
```

- [ ] **Step 7: Verificar que el servidor inicia**

```bash
cd apps/backend
cp .env.example .env
# Asegurarse de tener MongoDB corriendo localmente o via docker:
# docker run -d -p 27017:27017 mongo:7
npx tsx src/index.ts
```

Resultado esperado: `MongoDB connected` y `Backend running on http://localhost:4000`

- [ ] **Step 8: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): scaffold Express app with MongoDB connection"
```

---

## Task 4: Backend — Modelos Mongoose

**Files:**
- Create: `apps/backend/src/models/User.ts`
- Create: `apps/backend/src/models/Product.ts`
- Create: `apps/backend/src/models/Transaction.ts`

**Interfaces:**
- Consumes: tipos de `@marketplace/shared`
- Produces: `User`, `Product`, `Transaction` — modelos Mongoose exportados

- [ ] **Step 1: Crear `apps/backend/src/models/User.ts`**

```ts
import mongoose, { Schema, Document } from 'mongoose'
import { IUser } from '@marketplace/shared'

export interface UserDocument extends Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>, Document {
  passwordHash: string
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
  },
  { timestamps: true }
)

export const User = mongoose.model<UserDocument>('User', userSchema)
```

- [ ] **Step 2: Crear `apps/backend/src/models/Product.ts`**

```ts
import mongoose, { Schema, Document } from 'mongoose'
import { IProduct } from '@marketplace/shared'

export interface ProductDocument extends Omit<IProduct, '_id' | 'createdAt' | 'updatedAt'>, Document {}

const productSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    category: { type: String, required: true },
    attributes: { type: Map, of: String, default: {} },
    images: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Product = mongoose.model<ProductDocument>('Product', productSchema)
```

- [ ] **Step 3: Crear `apps/backend/src/models/Transaction.ts`**

```ts
import mongoose, { Schema, Document } from 'mongoose'
import { ITransaction } from '@marketplace/shared'

export interface TransactionDocument extends Omit<ITransaction, '_id' | 'createdAt'>, Document {}

const transactionSchema = new Schema<TransactionDocument>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    total: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
  },
  { timestamps: true }
)

export const Transaction = mongoose.model<TransactionDocument>('Transaction', transactionSchema)
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/models
git commit -m "feat(backend): add Mongoose models"
```

---

## Task 5: Backend — Auth routes y JWT middleware

**Files:**
- Create: `apps/backend/src/middleware/auth.ts`
- Create: `apps/backend/src/routes/auth.ts`
- Modify: `apps/backend/src/app.ts`

**Interfaces:**
- Produces: `requireAuth` middleware para proteger rutas
- Produces: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`

- [ ] **Step 1: Crear `apps/backend/src/middleware/auth.ts`**

```ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  userId?: string
  userRole?: string
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No autorizado' })
    return
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string }
    req.userId = payload.id
    req.userRole = payload.role
    next()
  } catch {
    res.status(401).json({ message: 'Token inválido' })
  }
}
```

- [ ] **Step 2: Crear `apps/backend/src/routes/auth.ts`**

```ts
import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { loginSchema } from '@marketplace/shared'
import { User } from '../models/User'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body)
    const user = await User.findOne({ email })
    if (!user) {
      res.status(401).json({ message: 'Credenciales incorrectas' })
      return
    }
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      res.status(401).json({ message: 'Credenciales incorrectas' })
      return
    }
    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    next(err)
  }
})

router.get('/me', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash')
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' })
      return
    }
    res.json(user)
  } catch (err) {
    next(err)
  }
})

router.post('/logout', (_req, res) => {
  res.json({ message: 'Sesión cerrada' })
})

export default router
```

- [ ] **Step 3: Registrar la ruta en `apps/backend/src/app.ts`**

Reemplazar el comentario `// routes se agregan en tasks siguientes` por:

```ts
import authRouter from './routes/auth'
// ...dentro de createApp(), antes de app.use(errorHandler):
app.use('/api/auth', authRouter)
```

- [ ] **Step 4: Crear un usuario admin seed para testing manual**

Crear `apps/backend/src/scripts/seed.ts`:

```ts
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { connectDB, disconnectDB } from '../lib/db'
import { User } from '../models/User'

async function seed() {
  await connectDB(process.env.MONGODB_URI!)
  const hash = await bcrypt.hash('admin123', 10)
  await User.findOneAndUpdate(
    { email: 'admin@marketplace.com' },
    { name: 'Admin', email: 'admin@marketplace.com', passwordHash: hash, role: 'admin' },
    { upsert: true }
  )
  console.log('Admin creado: admin@marketplace.com / admin123')
  await disconnectDB()
}

seed().catch(console.error)
```

Agregar script en `apps/backend/package.json`:
```json
"seed": "tsx src/scripts/seed.ts"
```

- [ ] **Step 5: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): add auth routes and JWT middleware"
```

---

## Task 6: Backend — Products routes (con tests)

**Files:**
- Create: `apps/backend/src/routes/products.ts`
- Create: `apps/backend/tests/products.test.ts`
- Modify: `apps/backend/src/app.ts`

**Interfaces:**
- Consumes: `Product` model, `requireAuth` middleware, `createProductSchema`, `updateProductSchema`
- Produces: `GET /api/products`, `GET /api/products/:slug`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`

- [ ] **Step 1: Crear `apps/backend/tests/products.test.ts` (tests primero)**

```ts
import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { createApp } from '../src/app'
import { User } from '../src/models/User'
import { Product } from '../src/models/Product'

let mongod: MongoMemoryServer
let app: ReturnType<typeof createApp>
let adminToken: string

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
  app = createApp()
  process.env.JWT_SECRET = 'test-secret'

  const hash = await bcrypt.hash('pass123', 10)
  await User.create({ name: 'Admin', email: 'admin@test.com', passwordHash: hash, role: 'admin' })
  const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'pass123' })
  adminToken = res.body.token
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

afterEach(async () => {
  await Product.deleteMany({})
})

describe('GET /api/products', () => {
  it('returns empty list when no products', async () => {
    const res = await request(app).get('/api/products')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })

  it('returns only active products', async () => {
    await Product.create({ name: 'Active', slug: 'active', description: 'desc desc desc desc', price: 10, stock: 5, category: 'cat', active: true })
    await Product.create({ name: 'Inactive', slug: 'inactive', description: 'desc desc desc desc', price: 10, stock: 5, category: 'cat', active: false })
    const res = await request(app).get('/api/products')
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].slug).toBe('active')
  })
})

describe('POST /api/products', () => {
  it('requires auth', async () => {
    const res = await request(app).post('/api/products').send({})
    expect(res.status).toBe(401)
  })

  it('creates product with valid data', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Laptop', description: 'Una laptop muy buena', price: 999, stock: 10, category: 'electronics' })
    expect(res.status).toBe(201)
    expect(res.body.slug).toBe('laptop')
  })
})

describe('DELETE /api/products/:id', () => {
  it('soft deletes product', async () => {
    const product = await Product.create({ name: 'To Delete', slug: 'to-delete', description: 'desc desc desc desc', price: 10, stock: 5, category: 'cat' })
    const res = await request(app)
      .delete(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    const found = await Product.findById(product._id)
    expect(found?.active).toBe(false)
  })
})
```

- [ ] **Step 2: Correr tests para verificar que fallan**

```bash
cd apps/backend
npx jest tests/products.test.ts --no-coverage
```

Resultado esperado: FAIL — routes no existen aún

- [ ] **Step 3: Crear `apps/backend/src/routes/products.ts`**

```ts
import { Router, Request, Response, NextFunction } from 'express'
import slugify from 'slugify'
import { createProductSchema, updateProductSchema } from '@marketplace/shared'
import { Product } from '../models/Product'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const filter: Record<string, unknown> = { active: true }
    if (req.query.category) filter.category = req.query.category
    if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' }

    const [data, total] = await Promise.all([
      Product.find(filter).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter),
    ])
    res.json({ data, total, page, pages: Math.ceil(total / limit) })
  } catch (err) { next(err) }
})

router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, active: true }).lean()
    if (!product) { res.status(404).json({ message: 'Producto no encontrado' }); return }
    res.json(product)
  } catch (err) { next(err) }
})

router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createProductSchema.parse(req.body)
    const slug = slugify(data.name, { lower: true, strict: true })
    const product = await Product.create({ ...data, slug })
    res.status(201).json(product)
  } catch (err) { next(err) }
})

router.put('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateProductSchema.parse(req.body)
    const update: typeof data & { slug?: string } = { ...data }
    if (data.name) update.slug = slugify(data.name, { lower: true, strict: true })
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!product) { res.status(404).json({ message: 'Producto no encontrado' }); return }
    res.json(product)
  } catch (err) { next(err) }
})

router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { active: false }, { new: true })
    if (!product) { res.status(404).json({ message: 'Producto no encontrado' }); return }
    res.json({ message: 'Producto desactivado' })
  } catch (err) { next(err) }
})

export default router
```

- [ ] **Step 4: Instalar slugify**

```bash
cd apps/backend
npm install slugify
npm install --save-dev @types/slugify
```

- [ ] **Step 5: Registrar ruta en `apps/backend/src/app.ts`**

```ts
import productsRouter from './routes/products'
// dentro de createApp():
app.use('/api/products', productsRouter)
```

- [ ] **Step 6: Correr tests para verificar que pasan**

```bash
cd apps/backend
npx jest tests/products.test.ts --no-coverage
```

Resultado esperado: PASS — 5 tests passing

- [ ] **Step 7: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): add products CRUD routes with tests"
```

---

## Task 7: Backend — Users routes (con tests)

**Files:**
- Create: `apps/backend/src/routes/users.ts`
- Create: `apps/backend/tests/users.test.ts`
- Modify: `apps/backend/src/app.ts`

**Interfaces:**
- Consumes: `User` model, `requireAuth`, `createUserSchema`, `updateUserSchema`
- Produces: `GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id`

- [ ] **Step 1: Crear `apps/backend/tests/users.test.ts`**

```ts
import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { createApp } from '../src/app'
import { User } from '../src/models/User'

let mongod: MongoMemoryServer
let app: ReturnType<typeof createApp>
let adminToken: string

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
  app = createApp()
  process.env.JWT_SECRET = 'test-secret'

  const hash = await bcrypt.hash('pass123', 10)
  await User.create({ name: 'Admin', email: 'admin@test.com', passwordHash: hash, role: 'admin' })
  const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'pass123' })
  adminToken = res.body.token
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

describe('GET /api/users', () => {
  it('requires auth', async () => {
    const res = await request(app).get('/api/users')
    expect(res.status).toBe(401)
  })

  it('returns users list for admin', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toBeInstanceOf(Array)
  })
})

describe('POST /api/users', () => {
  it('creates user and hashes password', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Juan', email: 'juan@test.com', password: 'pass123', role: 'customer' })
    expect(res.status).toBe(201)
    expect(res.body.passwordHash).toBeUndefined()
    expect(res.body.email).toBe('juan@test.com')
  })
})

describe('DELETE /api/users/:id', () => {
  it('deletes a user', async () => {
    const hash = await bcrypt.hash('pass', 10)
    const user = await User.create({ name: 'To Delete', email: 'del@test.com', passwordHash: hash, role: 'customer' })
    const res = await request(app)
      .delete(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(await User.findById(user._id)).toBeNull()
  })
})
```

- [ ] **Step 2: Correr tests para verificar que fallan**

```bash
npx jest tests/users.test.ts --no-coverage
```

Resultado esperado: FAIL

- [ ] **Step 3: Crear `apps/backend/src/routes/users.ts`**

```ts
import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import { createUserSchema, updateUserSchema } from '@marketplace/shared'
import { User } from '../models/User'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const [data, total] = await Promise.all([
      User.find().select('-passwordHash').skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(),
    ])
    res.json({ data, total, page, pages: Math.ceil(total / limit) })
  } catch (err) { next(err) }
})

router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password, ...data } = createUserSchema.parse(req.body)
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ ...data, passwordHash })
    const { passwordHash: _, ...userObj } = user.toObject()
    res.status(201).json(userObj)
  } catch (err) { next(err) }
})

router.put('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateUserSchema.parse(req.body)
    const user = await User.findByIdAndUpdate(req.params.id, data, { new: true }).select('-passwordHash')
    if (!user) { res.status(404).json({ message: 'Usuario no encontrado' }); return }
    res.json(user)
  } catch (err) { next(err) }
})

router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) { res.status(404).json({ message: 'Usuario no encontrado' }); return }
    res.json({ message: 'Usuario eliminado' })
  } catch (err) { next(err) }
})

export default router
```

- [ ] **Step 4: Registrar ruta en `apps/backend/src/app.ts`**

```ts
import usersRouter from './routes/users'
app.use('/api/users', usersRouter)
```

- [ ] **Step 5: Correr tests**

```bash
npx jest tests/users.test.ts --no-coverage
```

Resultado esperado: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): add users CRUD routes with tests"
```

---

## Task 8: Backend — Transactions routes (con tests)

**Files:**
- Create: `apps/backend/src/routes/transactions.ts`
- Create: `apps/backend/tests/transactions.test.ts`
- Modify: `apps/backend/src/app.ts`

**Interfaces:**
- Consumes: `Transaction` model, `requireAuth`, `createTransactionSchema`, `updateTransactionStatusSchema`
- Produces: `GET /api/transactions`, `GET /api/transactions/:id`, `POST /api/transactions`, `PATCH /api/transactions/:id/status`

- [ ] **Step 1: Crear `apps/backend/tests/transactions.test.ts`**

```ts
import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { createApp } from '../src/app'
import { User } from '../src/models/User'
import { Product } from '../src/models/Product'
import { Transaction } from '../src/models/Transaction'

let mongod: MongoMemoryServer
let app: ReturnType<typeof createApp>
let adminToken: string
let productId: string

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
  app = createApp()
  process.env.JWT_SECRET = 'test-secret'

  const hash = await bcrypt.hash('pass123', 10)
  await User.create({ name: 'Admin', email: 'admin@test.com', passwordHash: hash, role: 'admin' })
  const loginRes = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'pass123' })
  adminToken = loginRes.body.token

  const product = await Product.create({ name: 'Laptop', slug: 'laptop', description: 'desc desc desc desc', price: 999, stock: 10, category: 'electronics' })
  productId = product._id.toString()
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

afterEach(async () => {
  await Transaction.deleteMany({})
})

describe('POST /api/transactions', () => {
  it('creates transaction and calculates total', async () => {
    const res = await request(app).post('/api/transactions').send({
      customer: { name: 'Juan', email: 'juan@test.com' },
      items: [{ productId, name: 'Laptop', price: 999, quantity: 2 }],
    })
    expect(res.status).toBe(201)
    expect(res.body.total).toBe(1998)
    expect(res.body.orderNumber).toMatch(/^ORD-/)
    expect(res.body.status).toBe('pending')
  })
})

describe('PATCH /api/transactions/:id/status', () => {
  it('requires auth', async () => {
    const t = await Transaction.create({ orderNumber: 'ORD-001', customer: { name: 'J', email: 'j@t.com' }, items: [{ productId, name: 'L', price: 10, quantity: 1 }], total: 10 })
    const res = await request(app).patch(`/api/transactions/${t._id}/status`).send({ status: 'paid' })
    expect(res.status).toBe(401)
  })

  it('updates status', async () => {
    const t = await Transaction.create({ orderNumber: 'ORD-002', customer: { name: 'J', email: 'j@t.com' }, items: [{ productId, name: 'L', price: 10, quantity: 1 }], total: 10 })
    const res = await request(app)
      .patch(`/api/transactions/${t._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'paid' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('paid')
  })
})
```

- [ ] **Step 2: Correr tests para verificar que fallan**

```bash
npx jest tests/transactions.test.ts --no-coverage
```

Resultado esperado: FAIL

- [ ] **Step 3: Crear `apps/backend/src/routes/transactions.ts`**

```ts
import { Router, Request, Response, NextFunction } from 'express'
import { createTransactionSchema, updateTransactionStatusSchema } from '@marketplace/shared'
import { Transaction } from '../models/Transaction'
import { requireAuth } from '../middleware/auth'

const router = Router()

function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD-${year}-${random}`
}

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const filter: Record<string, unknown> = {}
    if (req.query.status) filter.status = req.query.status

    const [data, total] = await Promise.all([
      Transaction.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Transaction.countDocuments(filter),
    ])
    res.json({ data, total, page, pages: Math.ceil(total / limit) })
  } catch (err) { next(err) }
})

router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await Transaction.findById(req.params.id).lean()
    if (!transaction) { res.status(404).json({ message: 'Transacción no encontrada' }); return }
    res.json(transaction)
  } catch (err) { next(err) }
})

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createTransactionSchema.parse(req.body)
    const total = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const transaction = await Transaction.create({
      ...data,
      total,
      orderNumber: generateOrderNumber(),
    })
    res.status(201).json(transaction)
  } catch (err) { next(err) }
})

router.patch('/:id/status', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = updateTransactionStatusSchema.parse(req.body)
    const transaction = await Transaction.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!transaction) { res.status(404).json({ message: 'Transacción no encontrada' }); return }
    res.json(transaction)
  } catch (err) { next(err) }
})

export default router
```

- [ ] **Step 4: Registrar ruta en `apps/backend/src/app.ts`**

```ts
import transactionsRouter from './routes/transactions'
app.use('/api/transactions', transactionsRouter)
```

- [ ] **Step 5: Correr todos los tests del backend**

```bash
cd apps/backend
npx jest --no-coverage
```

Resultado esperado: PASS — todos los tests

- [ ] **Step 6: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): add transactions routes with tests"
```

---

## Task 9: Frontend — Setup Auth.js v5, TanStack Query y API client

**Files:**
- Modify: `apps/frontend/package.json`
- Create: `apps/frontend/auth.ts`
- Create: `apps/frontend/middleware.ts`
- Create: `apps/frontend/lib/api.ts`
- Create: `apps/frontend/lib/query-client.ts`
- Create: `apps/frontend/providers.tsx`
- Modify: `apps/frontend/app/layout.tsx`

**Interfaces:**
- Produces: `apiFetch(path, options)` — wrapper autenticado hacia el backend
- Produces: `queryClient` — instancia de TanStack Query
- Produces: rutas `/admin/*` protegidas por Auth.js v5

- [ ] **Step 1: Instalar dependencias del frontend**

```bash
cd apps/frontend
npm install next-auth@beta @tanstack/react-query react-hook-form @hookform/resolvers zod
npm install -D @tanstack/react-query-devtools
```

- [ ] **Step 2: Instalar shadcn/ui**

```bash
cd apps/frontend
npx shadcn@latest init
# Seleccionar: Default style, Zinc color, CSS variables: yes
npx shadcn@latest add button input label table badge select dialog form card
```

- [ ] **Step 3: Crear `apps/frontend/auth.ts`**

```ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { loginSchema } from '@marketplace/shared'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const res = await fetch(`${process.env.BACKEND_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
        })
        if (!res.ok) return null

        const { token, user } = await res.json()
        return { ...user, accessToken: token }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as typeof user & { accessToken: string }).accessToken
        token.role = (user as typeof user & { role: string }).role
      }
      return token
    },
    session({ session, token }) {
      session.user.accessToken = token.accessToken as string
      session.user.role = token.role as string
      return session
    },
  },
  pages: { signIn: '/login' },
})
```

- [ ] **Step 4: Crear `apps/frontend/middleware.ts`**

```ts
import { auth } from './auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
  if (isAdminRoute && !req.auth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
})

export const config = {
  matcher: ['/admin/:path*'],
}
```

- [ ] **Step 5: Crear `apps/frontend/lib/api.ts`**

```ts
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...rest } = options
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...rest.headers,
  }
  const res = await fetch(`${BACKEND_URL}${path}`, { ...rest, headers })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Error de red' }))
    throw new Error(error.message || `HTTP ${res.status}`)
  }
  return res.json()
}
```

- [ ] **Step 6: Crear `apps/frontend/lib/query-client.ts`**

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 },
  },
})
```

- [ ] **Step 7: Crear `apps/frontend/providers.tsx`**

```tsx
'use client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/query-client'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

- [ ] **Step 8: Actualizar `apps/frontend/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '../providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Marketplace',
  description: 'Portfolio project',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 9: Agregar `BACKEND_URL` y `AUTH_SECRET` a `apps/frontend/.env.local`**

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
BACKEND_URL=http://localhost:4000
AUTH_SECRET=change_this_secret_32_chars_min
```

- [ ] **Step 10: Agregar types para next-auth session en `apps/frontend/types/next-auth.d.ts`**

```ts
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      accessToken: string
      role: string
      name?: string | null
      email?: string | null
    }
  }
}
```

- [ ] **Step 11: Commit**

```bash
git add apps/frontend
git commit -m "feat(frontend): setup Auth.js v5, TanStack Query, and API client"
```

---

## Task 10: Frontend — Login page

**Files:**
- Create: `apps/frontend/app/(auth)/login/page.tsx`

**Interfaces:**
- Consumes: `signIn` de `auth.ts`, `loginSchema` de `@marketplace/shared`
- Produces: página `/login` con formulario que redirige a `/admin` al autenticar

- [ ] **Step 1: Crear `apps/frontend/app/(auth)/login/page.tsx`**

```tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { loginSchema, LoginInput } from '@marketplace/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    const result = await signIn('credentials', { ...data, redirect: false })
    if (result?.error) {
      setError('root', { message: 'Credenciales incorrectas' })
      return
    }
    router.push('/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Marketplace Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
            {errors.root && <p className="text-sm text-red-500">{errors.root.message}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/app/\(auth\)
git commit -m "feat(frontend): add login page"
```

---

## Task 11: Frontend — Admin layout y Dashboard

**Files:**
- Create: `apps/frontend/app/(admin)/layout.tsx`
- Create: `apps/frontend/app/(admin)/dashboard/page.tsx`
- Create: `apps/frontend/components/AdminNav.tsx`

**Interfaces:**
- Consumes: `auth()` de `auth.ts`, `apiFetch` de `lib/api.ts`
- Produces: layout con navegación lateral para todas las rutas `/admin/*`

- [ ] **Step 1: Crear `apps/frontend/components/AdminNav.tsx`**

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Productos' },
  { href: '/admin/users', label: 'Usuarios' },
  { href: '/admin/transactions', label: 'Transacciones' },
]

export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav className="w-56 min-h-screen bg-gray-900 text-white flex flex-col p-4">
      <h1 className="text-xl font-bold mb-8">Marketplace</h1>
      <ul className="space-y-2 flex-1">
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                'block px-3 py-2 rounded hover:bg-gray-700 text-sm',
                pathname === href && 'bg-gray-700'
              )}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="text-sm text-gray-400 hover:text-white mt-auto"
      >
        Cerrar sesión
      </button>
    </nav>
  )
}
```

- [ ] **Step 2: Crear `apps/frontend/app/(admin)/layout.tsx`**

```tsx
import { auth } from '../../auth'
import { redirect } from 'next/navigation'
import { AdminNav } from '../../components/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 p-8 bg-gray-50">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Crear `apps/frontend/app/(admin)/dashboard/page.tsx`**

```tsx
import { auth } from '../../../auth'
import { apiFetch } from '../../../lib/api'

async function getStats(token: string) {
  const [products, users, transactions] = await Promise.all([
    apiFetch<{ total: number }>('/api/products?limit=1', { token }),
    apiFetch<{ total: number }>('/api/users?limit=1', { token }),
    apiFetch<{ total: number }>('/api/transactions?limit=1', { token }),
  ])
  return { products: products.total, users: users.total, transactions: transactions.total }
}

export default async function DashboardPage() {
  const session = await auth()
  const stats = await getStats(session!.user.accessToken)

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Productos', value: stats.products },
          { label: 'Usuarios', value: stats.users },
          { label: 'Transacciones', value: stats.transactions },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend
git commit -m "feat(frontend): add admin layout, nav and dashboard"
```

---

## Task 12: Frontend — Admin Products

**Files:**
- Create: `apps/frontend/components/products/ProductTable.tsx`
- Create: `apps/frontend/components/products/ProductForm.tsx`
- Create: `apps/frontend/app/(admin)/products/page.tsx`
- Create: `apps/frontend/app/(admin)/products/new/page.tsx`
- Create: `apps/frontend/app/(admin)/products/[id]/page.tsx`

**Interfaces:**
- Consumes: `apiFetch`, `IProduct`, `createProductSchema`, `updateProductSchema`
- Produces: CRUD completo de productos en el panel admin

- [ ] **Step 1: Crear `apps/frontend/components/products/ProductTable.tsx`**

```tsx
'use client'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IProduct } from '@marketplace/shared'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiFetch } from '../../lib/api'

interface Props {
  products: IProduct[]
  token: string
}

export function ProductTable({ products, token }: Props) {
  const router = useRouter()
  const qc = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/products/${id}`, { method: 'DELETE', token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Precio</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p) => (
          <TableRow key={p._id}>
            <TableCell>{p.name}</TableCell>
            <TableCell>{p.category}</TableCell>
            <TableCell>${p.price}</TableCell>
            <TableCell>{p.stock}</TableCell>
            <TableCell>
              <Badge variant={p.active ? 'default' : 'secondary'}>
                {p.active ? 'Activo' : 'Inactivo'}
              </Badge>
            </TableCell>
            <TableCell className="space-x-2">
              <Button size="sm" variant="outline" onClick={() => router.push(`/admin/products/${p._id}`)}>
                Editar
              </Button>
              <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(p._id)}>
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

- [ ] **Step 2: Crear `apps/frontend/components/products/ProductForm.tsx`**

```tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createProductSchema, CreateProductInput } from '@marketplace/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '../../lib/api'

interface Props {
  token: string
  defaultValues?: Partial<CreateProductInput>
  productId?: string
}

export function ProductForm({ token, defaultValues, productId }: Props) {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues,
  })

  async function onSubmit(data: CreateProductInput) {
    if (productId) {
      await apiFetch(`/api/products/${productId}`, { method: 'PUT', body: JSON.stringify(data), token })
    } else {
      await apiFetch('/api/products', { method: 'POST', body: JSON.stringify(data), token })
    }
    router.push('/admin/products')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      {[
        { name: 'name', label: 'Nombre', type: 'text' },
        { name: 'description', label: 'Descripción', type: 'text' },
        { name: 'price', label: 'Precio', type: 'number' },
        { name: 'stock', label: 'Stock', type: 'number' },
        { name: 'category', label: 'Categoría', type: 'text' },
      ].map(({ name, label, type }) => (
        <div key={name}>
          <Label htmlFor={name}>{label}</Label>
          <Input
            id={name}
            type={type}
            {...register(name as keyof CreateProductInput, { valueAsNumber: type === 'number' })}
          />
          {errors[name as keyof CreateProductInput] && (
            <p className="text-sm text-red-500">{errors[name as keyof CreateProductInput]?.message}</p>
          )}
        </div>
      ))}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : productId ? 'Actualizar' : 'Crear producto'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: Crear `apps/frontend/app/(admin)/products/page.tsx`**

```tsx
import { auth } from '../../../auth'
import { apiFetch } from '../../../lib/api'
import { IProduct } from '@marketplace/shared'
import { ProductTable } from '../../../components/products/ProductTable'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function ProductsPage() {
  const session = await auth()
  const { data } = await apiFetch<{ data: IProduct[] }>('/api/products?limit=100', {
    token: session!.user.accessToken,
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Productos</h2>
        <Button asChild><Link href="/admin/products/new">Nuevo producto</Link></Button>
      </div>
      <ProductTable products={data} token={session!.user.accessToken} />
    </div>
  )
}
```

- [ ] **Step 4: Crear `apps/frontend/app/(admin)/products/new/page.tsx`**

```tsx
import { auth } from '../../../../auth'
import { ProductForm } from '../../../../components/products/ProductForm'

export default async function NewProductPage() {
  const session = await auth()
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Nuevo producto</h2>
      <ProductForm token={session!.user.accessToken} />
    </div>
  )
}
```

- [ ] **Step 5: Crear `apps/frontend/app/(admin)/products/[id]/page.tsx`**

```tsx
import { auth } from '../../../../auth'
import { apiFetch } from '../../../../lib/api'
import { IProduct } from '@marketplace/shared'
import { ProductForm } from '../../../../components/products/ProductForm'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const product = await apiFetch<IProduct>(`/api/products/${params.id}`, {
    token: session!.user.accessToken,
  }).catch(() => null)

  if (!product) return <p>Producto no encontrado</p>

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Editar producto</h2>
      <ProductForm token={session!.user.accessToken} defaultValues={product} productId={params.id} />
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/frontend
git commit -m "feat(frontend): add admin products CRUD pages"
```

---

## Task 13: Frontend — Admin Users y Transactions

**Files:**
- Create: `apps/frontend/components/users/UserForm.tsx`
- Create: `apps/frontend/components/users/UserTable.tsx`
- Create: `apps/frontend/app/(admin)/users/page.tsx`
- Create: `apps/frontend/app/(admin)/users/new/page.tsx`
- Create: `apps/frontend/components/transactions/TransactionTable.tsx`
- Create: `apps/frontend/app/(admin)/transactions/page.tsx`

**Interfaces:**
- Consumes: `apiFetch`, `IUser`, `ITransaction`, `createUserSchema`
- Produces: mantenedor de usuarios y tabla de transacciones con cambio de status

- [ ] **Step 1: Crear `apps/frontend/components/users/UserTable.tsx`**

```tsx
'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IUser } from '@marketplace/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiFetch } from '../../lib/api'

export function UserTable({ users, token }: { users: IUser[]; token: string }) {
  const qc = useQueryClient()
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/users/${id}`, { method: 'DELETE', token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((u) => (
          <TableRow key={u._id}>
            <TableCell>{u.name}</TableCell>
            <TableCell>{u.email}</TableCell>
            <TableCell><Badge>{u.role}</Badge></TableCell>
            <TableCell>
              <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(u._id)}>
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

- [ ] **Step 2: Crear `apps/frontend/components/users/UserForm.tsx`**

```tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createUserSchema, CreateUserInput } from '@marketplace/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '../../lib/api'

export function UserForm({ token }: { token: string }) {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
  })

  async function onSubmit(data: CreateUserInput) {
    await apiFetch('/api/users', { method: 'POST', body: JSON.stringify(data), token })
    router.push('/admin/users')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      {[
        { name: 'name', label: 'Nombre', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'password', label: 'Contraseña', type: 'password' },
      ].map(({ name, label, type }) => (
        <div key={name}>
          <Label htmlFor={name}>{label}</Label>
          <Input id={name} type={type} {...register(name as keyof CreateUserInput)} />
          {errors[name as keyof CreateUserInput] && (
            <p className="text-sm text-red-500">{errors[name as keyof CreateUserInput]?.message}</p>
          )}
        </div>
      ))}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creando...' : 'Crear usuario'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: Crear `apps/frontend/app/(admin)/users/page.tsx`**

```tsx
import { auth } from '../../../auth'
import { apiFetch } from '../../../lib/api'
import { IUser } from '@marketplace/shared'
import { UserTable } from '../../../components/users/UserTable'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function UsersPage() {
  const session = await auth()
  const { data } = await apiFetch<{ data: IUser[] }>('/api/users', { token: session!.user.accessToken })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Usuarios</h2>
        <Button asChild><Link href="/admin/users/new">Nuevo usuario</Link></Button>
      </div>
      <UserTable users={data} token={session!.user.accessToken} />
    </div>
  )
}
```

- [ ] **Step 4: Crear `apps/frontend/app/(admin)/users/new/page.tsx`**

```tsx
import { auth } from '../../../../auth'
import { UserForm } from '../../../../components/users/UserForm'

export default async function NewUserPage() {
  const session = await auth()
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Nuevo usuario</h2>
      <UserForm token={session!.user.accessToken} />
    </div>
  )
}
```

- [ ] **Step 5: Crear `apps/frontend/components/transactions/TransactionTable.tsx`**

```tsx
'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ITransaction, TransactionStatus } from '@marketplace/shared'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiFetch } from '../../lib/api'

const statusColors: Record<TransactionStatus, 'default' | 'secondary' | 'destructive'> = {
  pending: 'secondary',
  paid: 'default',
  cancelled: 'destructive',
}

export function TransactionTable({ transactions, token }: { transactions: ITransaction[]; token: string }) {
  const qc = useQueryClient()
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TransactionStatus }) =>
      apiFetch(`/api/transactions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }), token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Orden</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Fecha</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((t) => (
          <TableRow key={t._id}>
            <TableCell className="font-mono">{t.orderNumber}</TableCell>
            <TableCell>{t.customer.name} <span className="text-gray-400 text-xs">{t.customer.email}</span></TableCell>
            <TableCell>${t.total.toLocaleString()}</TableCell>
            <TableCell>
              <Select
                defaultValue={t.status}
                onValueChange={(val) => statusMutation.mutate({ id: t._id, status: val as TransactionStatus })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue>
                    <Badge variant={statusColors[t.status]}>{t.status}</Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">pending</SelectItem>
                  <SelectItem value="paid">paid</SelectItem>
                  <SelectItem value="cancelled">cancelled</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>{new Date(t.createdAt).toLocaleDateString('es')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

- [ ] **Step 6: Crear `apps/frontend/app/(admin)/transactions/page.tsx`**

```tsx
import { auth } from '../../../auth'
import { apiFetch } from '../../../lib/api'
import { ITransaction } from '@marketplace/shared'
import { TransactionTable } from '../../../components/transactions/TransactionTable'

export default async function TransactionsPage() {
  const session = await auth()
  const { data } = await apiFetch<{ data: ITransaction[] }>('/api/transactions', { token: session!.user.accessToken })

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Transacciones</h2>
      <TransactionTable transactions={data} token={session!.user.accessToken} />
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/frontend
git commit -m "feat(frontend): add admin users and transactions pages"
```

---

## Task 14: Frontend — Vitrina pública y Checkout Modal

**Files:**
- Create: `apps/frontend/app/(store)/page.tsx`
- Create: `apps/frontend/app/(store)/[slug]/page.tsx`
- Create: `apps/frontend/components/products/ProductCard.tsx`
- Create: `apps/frontend/components/transactions/CheckoutModal.tsx`

**Interfaces:**
- Consumes: `apiFetch` (sin token), `IProduct`, `createTransactionSchema`
- Produces: listado público de productos y flujo de checkout simulado

- [ ] **Step 1: Crear `apps/frontend/components/products/ProductCard.tsx`**

```tsx
import Link from 'next/link'
import { IProduct } from '@marketplace/shared'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function ProductCard({ product }: { product: IProduct }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        {product.images[0] && (
          <img src={product.images[0]} alt={product.name} className="w-full h-48 object-cover rounded mb-4" />
        )}
        <Badge variant="secondary" className="mb-2">{product.category}</Badge>
        <h3 className="font-semibold text-lg">{product.name}</h3>
        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{product.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <span className="text-xl font-bold">${product.price.toLocaleString()}</span>
        <Link href={`/${product.slug}`} className="text-sm text-blue-600 hover:underline">
          Ver detalle →
        </Link>
      </CardFooter>
    </Card>
  )
}
```

- [ ] **Step 2: Crear `apps/frontend/components/transactions/CheckoutModal.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '../../lib/api'
import { IProduct } from '@marketplace/shared'

const checkoutFormSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
})
type CheckoutFormInput = z.infer<typeof checkoutFormSchema>

interface Props {
  product: IProduct
}

export function CheckoutModal({ product }: Props) {
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutFormSchema),
  })

  async function onSubmit(data: CheckoutFormInput) {
    const result = await apiFetch<{ orderNumber: string }>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        customer: data,
        items: [{ productId: product._id, name: product.name, price: product.price, quantity: 1 }],
      }),
    })
    setOrderNumber(result.orderNumber)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full">Comprar ahora</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Completar compra</DialogTitle>
        </DialogHeader>
        {orderNumber ? (
          <div className="text-center py-6">
            <p className="text-green-600 text-lg font-semibold">¡Orden creada!</p>
            <p className="text-gray-500 mt-2">Número de orden: <span className="font-mono font-bold">{orderNumber}</span></p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-gray-500">Comprando: <strong>{product.name}</strong> — ${product.price}</p>
            <div>
              <Label>Nombre</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Procesando...' : 'Confirmar compra'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: Crear `apps/frontend/app/(store)/page.tsx`**

```tsx
import { apiFetch } from '../../lib/api'
import { IProduct } from '@marketplace/shared'
import { ProductCard } from '../../components/products/ProductCard'

export default async function StorePage() {
  const { data } = await apiFetch<{ data: IProduct[] }>('/api/products?limit=50')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <a href="/login" className="text-sm text-gray-500 hover:text-gray-900">Admin</a>
      </header>
      <main className="max-w-6xl mx-auto py-8 px-4">
        <h2 className="text-xl font-semibold mb-6">Productos disponibles</h2>
        {data.length === 0 ? (
          <p className="text-gray-400">No hay productos disponibles aún.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Crear `apps/frontend/app/(store)/[slug]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { apiFetch } from '../../../lib/api'
import { IProduct } from '@marketplace/shared'
import { CheckoutModal } from '../../../components/transactions/CheckoutModal'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await apiFetch<IProduct>(`/api/products/${params.slug}`).catch(() => null)
  if (!product) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-8">
        <Link href="/" className="text-sm text-blue-600 hover:underline">← Volver</Link>
      </header>
      <main className="max-w-2xl mx-auto py-8 px-4">
        <Badge variant="secondary" className="mb-2">{product.category}</Badge>
        <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
        <p className="text-2xl font-semibold text-gray-700 mb-4">${product.price.toLocaleString()}</p>
        <p className="text-gray-600 mb-6">{product.description}</p>
        <p className="text-sm text-gray-400 mb-6">Stock disponible: {product.stock}</p>
        <CheckoutModal product={product} />
      </main>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/frontend
git commit -m "feat(frontend): add public store pages and checkout modal"
```

---

## Task 15: Docker Compose e infraestructura

**Files:**
- Create: `apps/backend/Dockerfile`
- Create: `apps/frontend/Dockerfile`
- Create: `docker-compose.yml`
- Create: `.env.example` (raíz)

**Interfaces:**
- Produces: `docker compose up --build` levanta el stack completo en puertos 3000 (frontend) y 4000 (backend)

- [ ] **Step 1: Crear `apps/backend/Dockerfile`**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

- [ ] **Step 2: Crear `apps/frontend/Dockerfile`**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "server.js"]
```

- [ ] **Step 3: Agregar `output: 'standalone'` en `apps/frontend/next.config.ts`**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
}

export default nextConfig
```

- [ ] **Step 4: Crear `docker-compose.yml` en la raíz**

```yaml
services:
  mongo:
    image: mongo:7
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./apps/backend
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/marketplace
      - JWT_SECRET=${JWT_SECRET}
      - PORT=4000
      - FRONTEND_URL=http://localhost:3000
    depends_on:
      mongo:
        condition: service_healthy

  frontend:
    build:
      context: ./apps/frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
      - BACKEND_URL=http://backend:4000
      - AUTH_SECRET=${AUTH_SECRET}
    depends_on:
      - backend

volumes:
  mongo_data:
```

- [ ] **Step 5: Crear `.env.example` en la raíz**

```
JWT_SECRET=your_jwt_secret_here_min_32_chars
AUTH_SECRET=your_auth_secret_here_min_32_chars
```

- [ ] **Step 6: Crear `.env` local desde el ejemplo**

```bash
cp .env.example .env
# Editar .env con secrets reales
```

- [ ] **Step 7: Build y verificación del stack completo**

```bash
docker compose up --build
```

Resultado esperado:
- `http://localhost:3000` → vitrina pública
- `http://localhost:3000/login` → login admin
- `http://localhost:4000/health` → `{"status":"ok"}`

- [ ] **Step 8: Crear usuario admin en el stack Docker**

```bash
docker compose exec backend node -e "
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
mongoose.connect('mongodb://mongo:27017/marketplace').then(async () => {
  const hash = await bcrypt.hash('admin123', 10);
  await mongoose.connection.collection('users').updateOne(
    { email: 'admin@marketplace.com' },
    { \$set: { name: 'Admin', email: 'admin@marketplace.com', passwordHash: hash, role: 'admin', createdAt: new Date(), updatedAt: new Date() } },
    { upsert: true }
  );
  console.log('Admin creado');
  process.exit(0);
});
"
```

- [ ] **Step 9: Crear `README.md` en la raíz del proyecto**

```markdown
# Marketplace Portfolio

Tienda de artículos fullstack con Next.js 15, Express, MongoDB y Docker.

## Stack

- **Frontend:** Next.js 15, Auth.js v5, TailwindCSS, shadcn/ui, TanStack Query
- **Backend:** Express, TypeScript, Mongoose, Zod
- **DB:** MongoDB 7
- **Infra:** Docker Compose, Turborepo

## Quickstart

\`\`\`bash
cp .env.example .env
# Editar .env con tus secrets
docker compose up --build
\`\`\`

Abrir http://localhost:3000

**Admin:** http://localhost:3000/login  
Email: `admin@marketplace.com` / Password: `admin123`

## Desarrollo local

\`\`\`bash
docker compose up mongo -d
npm install
turbo dev
\`\`\`

## Tests

\`\`\`bash
cd apps/backend
npm test
\`\`\`
```

- [ ] **Step 10: Commit final**

```bash
git add .
git commit -m "feat: add Docker Compose and complete project setup"
```

---

## Checklist de cobertura del spec

- [x] Monorepo Turborepo con `apps/frontend`, `apps/backend`, `packages/shared`
- [x] Tipos compartidos entre frontend y backend via `@marketplace/shared`
- [x] Auth.js v5 para sesión del frontend
- [x] JWT en backend para proteger rutas `[admin]`
- [x] CRUD de productos con soft delete
- [x] CRUD de usuarios
- [x] Transacciones simuladas con checkout modal
- [x] Cambio de status de transacciones desde admin
- [x] Paginación en todos los listados
- [x] Docker Compose con mongo, backend y frontend
- [x] Tests con mongodb-memory-server en el backend
- [x] README con instrucciones claras
