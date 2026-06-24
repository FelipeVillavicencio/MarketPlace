# Marketplace Portfolio — Implementation Plan v2 (Clean Architecture)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una tienda de artículos genérica fullstack como proyecto de portafolio con admin único, transacciones simuladas, y stack moderno containerizado. El backend sigue Clean Architecture igual que los servicios de producción del equipo.

**Architecture:** Monorepo Turborepo con `apps/frontend` (Next.js 15) y `apps/backend` (Express + TypeScript) separados, comunicados via REST API. El backend sigue Clean Architecture en 4 capas: domain → interfaces → application → infrastructure. Tipos y schemas Zod compartidos en `packages/shared`. Frontend en Vercel, backend en Railway, MongoDB en Atlas.

**Tech Stack:** Next.js 15, Auth.js v5, TailwindCSS, shadcn/ui, TanStack Query, React Hook Form, Express, Mongoose, Zod, Jest, Supertest, mongodb-memory-server, Docker Compose, Turborepo.

## Estado al iniciar este plan

Tasks 1-3 del plan anterior ya están completas y commiteadas:
- ✅ Task 1: Monorepo scaffold (Turborepo, workspaces, Next.js frontend)
- ✅ Task 2: Shared types y Zod schemas (`@marketplace/shared`)
- ✅ Task 3: Backend scaffold (Express app factory, db.ts, errorHandler, index.ts)

El plan comienza en Task 4. El backend tiene `apps/backend/src/` con solo `lib/db.ts`, `middleware/errorHandler.ts`, `app.ts`, e `index.ts`.

## Global Constraints

- Node.js >= 20
- TypeScript strict mode en todos los packages
- MongoDB 7 (Atlas M0 en producción)
- Todas las rutas `/admin/*` del frontend requieren sesión Auth.js v5 válida
- Todas las rutas `[admin]` del backend requieren header `Authorization: Bearer <token>`
- DELETE de productos siempre es soft delete (`active: false`)
- Paginación con `?page=1&limit=20` en todos los listados
- Variables de entorno nunca commiteadas — solo `.env.example`
- **Clean Architecture:** dependencias solo apuntan hacia adentro (infrastructure → application → interfaces → domain). Domain no importa nada de Express ni Mongoose.

---

## File Map — Backend (Clean Architecture)

```
apps/backend/src/
├── domain/                          ← entidades puras, sin dependencias externas
│   ├── Product.ts
│   ├── User.ts
│   └── Transaction.ts
│
├── interfaces/                      ← contratos TypeScript (puertos)
│   ├── repositories/
│   │   ├── IProductRepository.ts
│   │   ├── IUserRepository.ts
│   │   └── ITransactionRepository.ts
│   └── services/
│       └── IAuthService.ts
│
├── application/                     ← casos de uso (orquestadores)
│   ├── dtos/
│   │   ├── product.dto.ts
│   │   ├── user.dto.ts
│   │   └── transaction.dto.ts
│   └── use-cases/
│       ├── products/
│       │   ├── CreateProduct.ts
│       │   ├── UpdateProduct.ts
│       │   ├── GetProducts.ts
│       │   ├── GetProductBySlug.ts
│       │   └── DeleteProduct.ts
│       ├── users/
│       │   ├── CreateUser.ts
│       │   ├── UpdateUser.ts
│       │   ├── GetUsers.ts
│       │   └── DeleteUser.ts
│       └── transactions/
│           ├── CreateTransaction.ts
│           ├── GetTransactions.ts
│           └── UpdateTransactionStatus.ts
│
└── infrastructure/                  ← Express, Mongoose, JWT — el mundo real
    ├── config/
    │   └── db.ts                    ← (mover desde lib/db.ts)
    ├── models/
    │   ├── ProductModel.ts
    │   ├── UserModel.ts
    │   └── TransactionModel.ts
    ├── repositories/
    │   ├── MongoProductRepository.ts
    │   ├── MongoUserRepository.ts
    │   └── MongoTransactionRepository.ts
    ├── services/
    │   └── AuthService.ts
    ├── controllers/
    │   ├── ProductController.ts
    │   ├── UserController.ts
    │   ├── TransactionController.ts
    │   └── AuthController.ts
    ├── routes/
    │   ├── products.ts
    │   ├── users.ts
    │   ├── transactions.ts
    │   └── auth.ts
    ├── middlewares/
    │   ├── auth.ts                  ← (ya existe)
    │   └── errorHandler.ts          ← (ya existe)
    └── app.ts                       ← (ya existe, agregar rutas)
```

## File Map — Frontend (sin cambios)

```
apps/frontend/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (admin)/layout.tsx
│   ├── (admin)/dashboard/page.tsx
│   ├── (admin)/products/page.tsx
│   ├── (admin)/products/new/page.tsx
│   ├── (admin)/products/[id]/page.tsx
│   ├── (admin)/users/page.tsx
│   ├── (admin)/users/new/page.tsx
│   ├── (admin)/transactions/page.tsx
│   ├── (store)/page.tsx
│   └── (store)/[slug]/page.tsx
├── components/
│   ├── products/ProductCard.tsx
│   ├── products/ProductForm.tsx
│   ├── products/ProductTable.tsx
│   ├── users/UserForm.tsx
│   ├── users/UserTable.tsx
│   ├── transactions/TransactionTable.tsx
│   └── transactions/CheckoutModal.tsx
├── lib/api.ts
├── lib/query-client.ts
├── auth.ts
└── middleware.ts
```

---

## Task 4: Domain Entities

**Files:**
- Create: `apps/backend/src/domain/Product.ts`
- Create: `apps/backend/src/domain/User.ts`
- Create: `apps/backend/src/domain/Transaction.ts`

**Interfaces:**
- Produces: clases de dominio puras exportadas — `Product`, `User`, `Transaction`
- Estas clases NO importan nada externo (ni Mongoose, ni Zod, ni Express)
- Contienen validación de invariantes de negocio en el constructor

- [ ] **Step 1: Crear `apps/backend/src/domain/Product.ts`**

```ts
export class Product {
  readonly _id?: string
  readonly name: string
  readonly slug: string
  readonly description: string
  readonly price: number
  readonly stock: number
  readonly category: string
  readonly attributes: Record<string, string>
  readonly images: string[]
  readonly active: boolean
  readonly createdAt?: Date
  readonly updatedAt?: Date

  constructor(data: {
    _id?: string
    name: string
    slug: string
    description: string
    price: number
    stock: number
    category: string
    attributes?: Record<string, string>
    images?: string[]
    active?: boolean
    createdAt?: Date
    updatedAt?: Date
  }) {
    if (data.price <= 0) throw new Error('El precio debe ser positivo')
    if (data.stock < 0) throw new Error('El stock no puede ser negativo')
    if (data.name.trim().length < 2) throw new Error('El nombre es requerido')

    this._id = data._id
    this.name = data.name.trim()
    this.slug = data.slug
    this.description = data.description
    this.price = data.price
    this.stock = data.stock
    this.category = data.category
    this.attributes = data.attributes ?? {}
    this.images = data.images ?? []
    this.active = data.active ?? true
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
```

- [ ] **Step 2: Crear `apps/backend/src/domain/User.ts`**

```ts
export type UserRole = 'admin' | 'customer'

export class User {
  readonly _id?: string
  readonly name: string
  readonly email: string
  readonly passwordHash: string
  readonly role: UserRole
  readonly createdAt?: Date
  readonly updatedAt?: Date

  constructor(data: {
    _id?: string
    name: string
    email: string
    passwordHash: string
    role?: UserRole
    createdAt?: Date
    updatedAt?: Date
  }) {
    if (data.name.trim().length < 2) throw new Error('El nombre es requerido')
    if (!data.email.includes('@')) throw new Error('Email inválido')

    this._id = data._id
    this.name = data.name.trim()
    this.email = data.email.toLowerCase()
    this.passwordHash = data.passwordHash
    this.role = data.role ?? 'customer'
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
```

- [ ] **Step 3: Crear `apps/backend/src/domain/Transaction.ts`**

```ts
export type TransactionStatus = 'pending' | 'paid' | 'cancelled'

export interface TransactionItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export class Transaction {
  readonly _id?: string
  readonly orderNumber: string
  readonly customer: { name: string; email: string }
  readonly items: TransactionItem[]
  readonly total: number
  readonly status: TransactionStatus
  readonly createdAt?: Date

  constructor(data: {
    _id?: string
    orderNumber: string
    customer: { name: string; email: string }
    items: TransactionItem[]
    status?: TransactionStatus
    createdAt?: Date
  }) {
    if (data.items.length === 0) throw new Error('La transacción debe tener al menos un item')
    if (!data.customer.email.includes('@')) throw new Error('Email de cliente inválido')

    this._id = data._id
    this.orderNumber = data.orderNumber
    this.customer = data.customer
    this.items = data.items
    this.total = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    this.status = data.status ?? 'pending'
    this.createdAt = data.createdAt
  }
}
```

- [ ] **Step 4: Verificar que no hay imports externos en ningún archivo domain**

```bash
cd apps/backend
grep -r "import" src/domain/
```

Resultado esperado: ninguna línea debe contener `mongoose`, `express`, `zod`, o cualquier paquete npm.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/domain
git commit -m "feat(backend): add domain entities"
```

---

## Task 5: Interfaces (Contratos de Repositorios y Servicios)

**Files:**
- Create: `apps/backend/src/interfaces/repositories/IProductRepository.ts`
- Create: `apps/backend/src/interfaces/repositories/IUserRepository.ts`
- Create: `apps/backend/src/interfaces/repositories/ITransactionRepository.ts`
- Create: `apps/backend/src/interfaces/services/IAuthService.ts`

**Interfaces:**
- Consumes: `Product`, `User`, `Transaction` del domain
- Produces: contratos que los repositorios de infrastructure implementarán y los use-cases consumirán

- [ ] **Step 1: Crear `apps/backend/src/interfaces/repositories/IProductRepository.ts`**

```ts
import { Product } from '../../domain/Product'

export interface ProductFilters {
  active?: boolean
  category?: string
  search?: string
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pages: number
}

export interface IProductRepository {
  create(product: Product): Promise<Product>
  findById(id: string): Promise<Product | null>
  findBySlug(slug: string): Promise<Product | null>
  findAll(filters: ProductFilters): Promise<PaginatedResult<Product>>
  update(id: string, data: Partial<Omit<Product, '_id' | 'createdAt' | 'updatedAt'>>): Promise<Product | null>
  softDelete(id: string): Promise<Product | null>
}
```

- [ ] **Step 2: Crear `apps/backend/src/interfaces/repositories/IUserRepository.ts`**

```ts
import { User } from '../../domain/User'

export interface UserFilters {
  page?: number
  limit?: number
}

export interface IUserRepository {
  create(user: User): Promise<User>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findAll(filters: UserFilters): Promise<{ data: User[]; total: number }>
  update(id: string, data: Partial<Omit<User, '_id' | 'createdAt' | 'updatedAt'>>): Promise<User | null>
  delete(id: string): Promise<boolean>
}
```

- [ ] **Step 3: Crear `apps/backend/src/interfaces/repositories/ITransactionRepository.ts`**

```ts
import { Transaction, TransactionStatus } from '../../domain/Transaction'

export interface TransactionFilters {
  status?: TransactionStatus
  page?: number
  limit?: number
}

export interface ITransactionRepository {
  create(transaction: Transaction): Promise<Transaction>
  findById(id: string): Promise<Transaction | null>
  findAll(filters: TransactionFilters): Promise<{ data: Transaction[]; total: number }>
  updateStatus(id: string, status: TransactionStatus): Promise<Transaction | null>
}
```

- [ ] **Step 4: Crear `apps/backend/src/interfaces/services/IAuthService.ts`**

```ts
import { User } from '../../domain/User'

export interface AuthPayload {
  token: string
  user: Omit<User, 'passwordHash'>
}

export interface IAuthService {
  login(email: string, password: string): Promise<AuthPayload>
  verifyToken(token: string): Promise<{ id: string; role: string }>
  hashPassword(password: string): Promise<string>
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/interfaces
git commit -m "feat(backend): add repository and service interfaces"
```

---

## Task 6: Infrastructure — Modelos y Repositorios Mongoose

**Files:**
- Create: `apps/backend/src/infrastructure/models/ProductModel.ts`
- Create: `apps/backend/src/infrastructure/models/UserModel.ts`
- Create: `apps/backend/src/infrastructure/models/TransactionModel.ts`
- Create: `apps/backend/src/infrastructure/repositories/MongoProductRepository.ts`
- Create: `apps/backend/src/infrastructure/repositories/MongoUserRepository.ts`
- Create: `apps/backend/src/infrastructure/repositories/MongoTransactionRepository.ts`
- Move: `apps/backend/src/lib/db.ts` → `apps/backend/src/infrastructure/config/db.ts`

**Interfaces:**
- Consumes: domain entities, repository interfaces
- Produces: implementaciones concretas de `IProductRepository`, `IUserRepository`, `ITransactionRepository`

- [ ] **Step 1: Mover `lib/db.ts` a `infrastructure/config/db.ts`**

```bash
mkdir -p apps/backend/src/infrastructure/config
mv apps/backend/src/lib/db.ts apps/backend/src/infrastructure/config/db.ts
rmdir apps/backend/src/lib
```

Actualizar la importación en `apps/backend/src/index.ts`:
```ts
import { connectDB } from './infrastructure/config/db'
```

- [ ] **Step 2: Crear `apps/backend/src/infrastructure/models/ProductModel.ts`**

```ts
import mongoose, { Schema, Document } from 'mongoose'

export interface ProductDocument extends Document {
  name: string
  slug: string
  description: string
  price: number
  stock: number
  category: string
  attributes: Map<string, string>
  images: string[]
  active: boolean
}

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

export const ProductModel = mongoose.model<ProductDocument>('Product', productSchema)
```

- [ ] **Step 3: Crear `apps/backend/src/infrastructure/models/UserModel.ts`**

```ts
import mongoose, { Schema, Document } from 'mongoose'
import { UserRole } from '../../domain/User'

export interface UserDocument extends Document {
  name: string
  email: string
  passwordHash: string
  role: UserRole
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

export const UserModel = mongoose.model<UserDocument>('User', userSchema)
```

- [ ] **Step 4: Crear `apps/backend/src/infrastructure/models/TransactionModel.ts`**

```ts
import mongoose, { Schema, Document } from 'mongoose'
import { TransactionStatus } from '../../domain/Transaction'

export interface TransactionDocument extends Document {
  orderNumber: string
  customer: { name: string; email: string }
  items: Array<{ productId: mongoose.Types.ObjectId; name: string; price: number; quantity: number }>
  total: number
  status: TransactionStatus
}

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

export const TransactionModel = mongoose.model<TransactionDocument>('Transaction', transactionSchema)
```

- [ ] **Step 5: Crear `apps/backend/src/infrastructure/repositories/MongoProductRepository.ts`**

```ts
import slugify from 'slugify'
import { IProductRepository, ProductFilters, PaginatedResult } from '../../interfaces/repositories/IProductRepository'
import { Product } from '../../domain/Product'
import { ProductModel } from '../models/ProductModel'

function toProduct(doc: any): Product {
  return new Product({
    _id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    price: doc.price,
    stock: doc.stock,
    category: doc.category,
    attributes: doc.attributes instanceof Map ? Object.fromEntries(doc.attributes) : doc.attributes ?? {},
    images: doc.images,
    active: doc.active,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  })
}

export class MongoProductRepository implements IProductRepository {
  async create(product: Product): Promise<Product> {
    const doc = await ProductModel.create(product)
    return toProduct(doc)
  }

  async findById(id: string): Promise<Product | null> {
    const doc = await ProductModel.findById(id).lean()
    return doc ? toProduct(doc) : null
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const doc = await ProductModel.findOne({ slug }).lean()
    return doc ? toProduct(doc) : null
  }

  async findAll(filters: ProductFilters): Promise<PaginatedResult<Product>> {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    const query: Record<string, unknown> = {}

    if (filters.active !== undefined) query.active = filters.active
    if (filters.category) query.category = filters.category
    if (filters.search) query.name = { $regex: filters.search, $options: 'i' }

    const [docs, total] = await Promise.all([
      ProductModel.find(query).skip((page - 1) * limit).limit(limit).lean(),
      ProductModel.countDocuments(query),
    ])

    return { data: docs.map(toProduct), total, page, pages: Math.ceil(total / limit) }
  }

  async update(id: string, data: Partial<Omit<Product, '_id' | 'createdAt' | 'updatedAt'>>): Promise<Product | null> {
    const update: typeof data & { slug?: string } = { ...data }
    if (data.name) update.slug = slugify(data.name, { lower: true, strict: true })
    const doc = await ProductModel.findByIdAndUpdate(id, update, { new: true }).lean()
    return doc ? toProduct(doc) : null
  }

  async softDelete(id: string): Promise<Product | null> {
    const doc = await ProductModel.findByIdAndUpdate(id, { active: false }, { new: true }).lean()
    return doc ? toProduct(doc) : null
  }
}
```

- [ ] **Step 6: Instalar slugify**

```bash
cd apps/backend
npm install slugify
```

- [ ] **Step 7: Crear `apps/backend/src/infrastructure/repositories/MongoUserRepository.ts`**

```ts
import { IUserRepository, UserFilters } from '../../interfaces/repositories/IUserRepository'
import { User } from '../../domain/User'
import { UserModel } from '../models/UserModel'

function toUser(doc: any): User {
  return new User({
    _id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash,
    role: doc.role,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  })
}

export class MongoUserRepository implements IUserRepository {
  async create(user: User): Promise<User> {
    const doc = await UserModel.create(user)
    return toUser(doc)
  }

  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).lean()
    return doc ? toUser(doc) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean()
    return doc ? toUser(doc) : null
  }

  async findAll(filters: UserFilters): Promise<{ data: User[]; total: number }> {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    const [docs, total] = await Promise.all([
      UserModel.find().skip((page - 1) * limit).limit(limit).lean(),
      UserModel.countDocuments(),
    ])
    return { data: docs.map(toUser), total }
  }

  async update(id: string, data: Partial<Omit<User, '_id' | 'createdAt' | 'updatedAt'>>): Promise<User | null> {
    const doc = await UserModel.findByIdAndUpdate(id, data, { new: true }).lean()
    return doc ? toUser(doc) : null
  }

  async delete(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id)
    return result !== null
  }
}
```

- [ ] **Step 8: Crear `apps/backend/src/infrastructure/repositories/MongoTransactionRepository.ts`**

```ts
import { ITransactionRepository, TransactionFilters } from '../../interfaces/repositories/ITransactionRepository'
import { Transaction, TransactionStatus } from '../../domain/Transaction'
import { TransactionModel } from '../models/TransactionModel'

function toTransaction(doc: any): Transaction {
  return new Transaction({
    _id: doc._id.toString(),
    orderNumber: doc.orderNumber,
    customer: doc.customer,
    items: doc.items.map((i: any) => ({
      productId: i.productId.toString(),
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    })),
    status: doc.status,
    createdAt: doc.createdAt,
  })
}

export class MongoTransactionRepository implements ITransactionRepository {
  async create(transaction: Transaction): Promise<Transaction> {
    const doc = await TransactionModel.create(transaction)
    return toTransaction(doc)
  }

  async findById(id: string): Promise<Transaction | null> {
    const doc = await TransactionModel.findById(id).lean()
    return doc ? toTransaction(doc) : null
  }

  async findAll(filters: TransactionFilters): Promise<{ data: Transaction[]; total: number }> {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    const query: Record<string, unknown> = {}
    if (filters.status) query.status = filters.status

    const [docs, total] = await Promise.all([
      TransactionModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      TransactionModel.countDocuments(query),
    ])
    return { data: docs.map(toTransaction), total }
  }

  async updateStatus(id: string, status: TransactionStatus): Promise<Transaction | null> {
    const doc = await TransactionModel.findByIdAndUpdate(id, { status }, { new: true }).lean()
    return doc ? toTransaction(doc) : null
  }
}
```

- [ ] **Step 9: Commit**

```bash
git add apps/backend/src
git commit -m "feat(backend): add Mongoose models and repositories"
```

---

## Task 7: Application — Use Cases de Productos

**Files:**
- Create: `apps/backend/src/application/dtos/product.dto.ts`
- Create: `apps/backend/src/application/use-cases/products/CreateProduct.ts`
- Create: `apps/backend/src/application/use-cases/products/GetProducts.ts`
- Create: `apps/backend/src/application/use-cases/products/GetProductBySlug.ts`
- Create: `apps/backend/src/application/use-cases/products/UpdateProduct.ts`
- Create: `apps/backend/src/application/use-cases/products/DeleteProduct.ts`
- Create: `apps/backend/tests/use-cases/CreateProduct.test.ts`

**Interfaces:**
- Consumes: `IProductRepository`, `Product` domain entity
- Produces: use-cases testeables con repositorios falsos (sin MongoDB)

- [ ] **Step 1: Crear `apps/backend/src/application/dtos/product.dto.ts`**

```ts
export interface CreateProductDTO {
  name: string
  description: string
  price: number
  stock: number
  category: string
  attributes?: Record<string, string>
  images?: string[]
}

export interface UpdateProductDTO {
  name?: string
  description?: string
  price?: number
  stock?: number
  category?: string
  attributes?: Record<string, string>
  images?: string[]
  active?: boolean
}

export interface GetProductsDTO {
  category?: string
  search?: string
  page?: number
  limit?: number
  includeInactive?: boolean
}
```

- [ ] **Step 2: Escribir test primero — `apps/backend/tests/use-cases/CreateProduct.test.ts`**

```ts
import { CreateProductUseCase } from '../../src/application/use-cases/products/CreateProduct'
import { IProductRepository, PaginatedResult } from '../../src/interfaces/repositories/IProductRepository'
import { Product } from '../../src/domain/Product'

const makeRepo = (overrides: Partial<IProductRepository> = {}): IProductRepository => ({
  create: jest.fn().mockImplementation(async (p: Product) => p),
  findById: jest.fn().mockResolvedValue(null),
  findBySlug: jest.fn().mockResolvedValue(null),
  findAll: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, pages: 0 } as PaginatedResult<Product>),
  update: jest.fn().mockResolvedValue(null),
  softDelete: jest.fn().mockResolvedValue(null),
  ...overrides,
})

describe('CreateProductUseCase', () => {
  it('creates a product and generates slug from name', async () => {
    const repo = makeRepo()
    const useCase = new CreateProductUseCase(repo)

    const result = await useCase.execute({
      name: 'Laptop Pro',
      description: 'Una laptop muy buena para trabajar',
      price: 999,
      stock: 10,
      category: 'electronics',
    })

    expect(result.name).toBe('Laptop Pro')
    expect(result.slug).toBe('laptop-pro')
    expect(repo.create).toHaveBeenCalledTimes(1)
  })

  it('throws if product with same slug already exists', async () => {
    const existing = new Product({ name: 'Laptop Pro', slug: 'laptop-pro', description: 'x', price: 100, stock: 1, category: 'x' })
    const repo = makeRepo({ findBySlug: jest.fn().mockResolvedValue(existing) })
    const useCase = new CreateProductUseCase(repo)

    await expect(
      useCase.execute({ name: 'Laptop Pro', description: 'y', price: 200, stock: 5, category: 'y' })
    ).rejects.toThrow('Ya existe un producto con ese nombre')
  })

  it('throws if price is zero or negative', async () => {
    const repo = makeRepo()
    const useCase = new CreateProductUseCase(repo)

    await expect(
      useCase.execute({ name: 'Producto', description: 'desc desc desc desc desc', price: 0, stock: 1, category: 'cat' })
    ).rejects.toThrow()
  })
})
```

- [ ] **Step 3: Correr test para verificar que falla**

```bash
cd apps/backend
npx jest tests/use-cases/CreateProduct.test.ts --no-coverage
```

Resultado esperado: FAIL — módulo no existe

- [ ] **Step 4: Crear `apps/backend/src/application/use-cases/products/CreateProduct.ts`**

```ts
import slugify from 'slugify'
import { IProductRepository } from '../../../interfaces/repositories/IProductRepository'
import { Product } from '../../../domain/Product'
import { CreateProductDTO } from '../../dtos/product.dto'

export class CreateProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(dto: CreateProductDTO): Promise<Product> {
    const slug = slugify(dto.name, { lower: true, strict: true })
    const existing = await this.productRepo.findBySlug(slug)
    if (existing) throw new Error('Ya existe un producto con ese nombre')

    const product = new Product({ ...dto, slug })
    return this.productRepo.create(product)
  }
}
```

- [ ] **Step 5: Correr test para verificar que pasa**

```bash
npx jest tests/use-cases/CreateProduct.test.ts --no-coverage
```

Resultado esperado: PASS — 3 tests passing

- [ ] **Step 6: Crear los demás use-cases de productos**

`apps/backend/src/application/use-cases/products/GetProducts.ts`:
```ts
import { IProductRepository } from '../../../interfaces/repositories/IProductRepository'
import { GetProductsDTO } from '../../dtos/product.dto'

export class GetProductsUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(dto: GetProductsDTO = {}) {
    return this.productRepo.findAll({
      active: dto.includeInactive ? undefined : true,
      category: dto.category,
      search: dto.search,
      page: dto.page,
      limit: dto.limit,
    })
  }
}
```

`apps/backend/src/application/use-cases/products/GetProductBySlug.ts`:
```ts
import { IProductRepository } from '../../../interfaces/repositories/IProductRepository'
import { Product } from '../../../domain/Product'

export class GetProductBySlugUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(slug: string): Promise<Product> {
    const product = await this.productRepo.findBySlug(slug)
    if (!product || !product.active) throw new Error('Producto no encontrado')
    return product
  }
}
```

`apps/backend/src/application/use-cases/products/UpdateProduct.ts`:
```ts
import slugify from 'slugify'
import { IProductRepository } from '../../../interfaces/repositories/IProductRepository'
import { Product } from '../../../domain/Product'
import { UpdateProductDTO } from '../../dtos/product.dto'

export class UpdateProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string, dto: UpdateProductDTO): Promise<Product> {
    const update: UpdateProductDTO & { slug?: string } = { ...dto }
    if (dto.name) update.slug = slugify(dto.name, { lower: true, strict: true })
    const product = await this.productRepo.update(id, update)
    if (!product) throw new Error('Producto no encontrado')
    return product
  }
}
```

`apps/backend/src/application/use-cases/products/DeleteProduct.ts`:
```ts
import { IProductRepository } from '../../../interfaces/repositories/IProductRepository'

export class DeleteProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string): Promise<void> {
    const product = await this.productRepo.softDelete(id)
    if (!product) throw new Error('Producto no encontrado')
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): add product use-cases with unit tests"
```

---

## Task 8: Application — Use Cases de Users y Transactions

**Files:**
- Create: `apps/backend/src/application/dtos/user.dto.ts`
- Create: `apps/backend/src/application/dtos/transaction.dto.ts`
- Create: `apps/backend/src/application/use-cases/users/` (4 use-cases)
- Create: `apps/backend/src/application/use-cases/transactions/` (3 use-cases)
- Create: `apps/backend/tests/use-cases/CreateUser.test.ts`

**Interfaces:**
- Consumes: `IUserRepository`, `ITransactionRepository`, `User`, `Transaction`
- Produces: use-cases testeables para users y transactions

- [ ] **Step 1: Crear `apps/backend/src/application/dtos/user.dto.ts`**

```ts
export interface CreateUserDTO {
  name: string
  email: string
  password: string
  role?: 'admin' | 'customer'
}

export interface UpdateUserDTO {
  name?: string
  email?: string
}
```

- [ ] **Step 2: Crear `apps/backend/src/application/dtos/transaction.dto.ts`**

```ts
import { TransactionStatus } from '../../domain/Transaction'

export interface CreateTransactionDTO {
  customer: { name: string; email: string }
  items: Array<{ productId: string; name: string; price: number; quantity: number }>
}

export interface GetTransactionsDTO {
  status?: TransactionStatus
  page?: number
  limit?: number
}
```

- [ ] **Step 3: Escribir test — `apps/backend/tests/use-cases/CreateUser.test.ts`**

```ts
import { CreateUserUseCase } from '../../src/application/use-cases/users/CreateUser'
import { IUserRepository } from '../../src/interfaces/repositories/IUserRepository'
import { IAuthService, AuthPayload } from '../../src/interfaces/services/IAuthService'
import { User } from '../../src/domain/User'

const makeUserRepo = (overrides: Partial<IUserRepository> = {}): IUserRepository => ({
  create: jest.fn().mockImplementation(async (u: User) => u),
  findById: jest.fn().mockResolvedValue(null),
  findByEmail: jest.fn().mockResolvedValue(null),
  findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
  update: jest.fn().mockResolvedValue(null),
  delete: jest.fn().mockResolvedValue(true),
  ...overrides,
})

const makeAuthService = (): IAuthService => ({
  login: jest.fn().mockResolvedValue({} as AuthPayload),
  verifyToken: jest.fn().mockResolvedValue({ id: '1', role: 'admin' }),
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
})

describe('CreateUserUseCase', () => {
  it('hashes password and creates user', async () => {
    const repo = makeUserRepo()
    const auth = makeAuthService()
    const useCase = new CreateUserUseCase(repo, auth)

    const result = await useCase.execute({ name: 'Juan', email: 'juan@test.com', password: 'pass123' })

    expect(auth.hashPassword).toHaveBeenCalledWith('pass123')
    expect(repo.create).toHaveBeenCalledTimes(1)
    expect(result.email).toBe('juan@test.com')
  })

  it('throws if email already exists', async () => {
    const existing = new User({ name: 'Existing', email: 'juan@test.com', passwordHash: 'hash' })
    const repo = makeUserRepo({ findByEmail: jest.fn().mockResolvedValue(existing) })
    const useCase = new CreateUserUseCase(repo, makeAuthService())

    await expect(useCase.execute({ name: 'Juan', email: 'juan@test.com', password: 'pass' }))
      .rejects.toThrow('El email ya está registrado')
  })
})
```

- [ ] **Step 4: Correr test para verificar que falla**

```bash
cd apps/backend
npx jest tests/use-cases/CreateUser.test.ts --no-coverage
```

Resultado esperado: FAIL

- [ ] **Step 5: Crear use-cases de users**

`apps/backend/src/application/use-cases/users/CreateUser.ts`:
```ts
import { IUserRepository } from '../../../interfaces/repositories/IUserRepository'
import { IAuthService } from '../../../interfaces/services/IAuthService'
import { User } from '../../../domain/User'
import { CreateUserDTO } from '../../dtos/user.dto'

export class CreateUserUseCase {
  constructor(
    private userRepo: IUserRepository,
    private authService: IAuthService,
  ) {}

  async execute(dto: CreateUserDTO): Promise<User> {
    const existing = await this.userRepo.findByEmail(dto.email)
    if (existing) throw new Error('El email ya está registrado')

    const passwordHash = await this.authService.hashPassword(dto.password)
    const user = new User({ name: dto.name, email: dto.email, passwordHash, role: dto.role })
    return this.userRepo.create(user)
  }
}
```

`apps/backend/src/application/use-cases/users/GetUsers.ts`:
```ts
import { IUserRepository } from '../../../interfaces/repositories/IUserRepository'

export class GetUsersUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(page = 1, limit = 20) {
    return this.userRepo.findAll({ page, limit })
  }
}
```

`apps/backend/src/application/use-cases/users/UpdateUser.ts`:
```ts
import { IUserRepository } from '../../../interfaces/repositories/IUserRepository'
import { User } from '../../../domain/User'
import { UpdateUserDTO } from '../../dtos/user.dto'

export class UpdateUserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(id: string, dto: UpdateUserDTO): Promise<User> {
    const user = await this.userRepo.update(id, dto)
    if (!user) throw new Error('Usuario no encontrado')
    return user
  }
}
```

`apps/backend/src/application/use-cases/users/DeleteUser.ts`:
```ts
import { IUserRepository } from '../../../interfaces/repositories/IUserRepository'

export class DeleteUserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.userRepo.delete(id)
    if (!deleted) throw new Error('Usuario no encontrado')
  }
}
```

- [ ] **Step 6: Crear use-cases de transactions**

`apps/backend/src/application/use-cases/transactions/CreateTransaction.ts`:
```ts
import { ITransactionRepository } from '../../../interfaces/repositories/ITransactionRepository'
import { Transaction } from '../../../domain/Transaction'
import { CreateTransactionDTO } from '../../dtos/transaction.dto'

function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD-${year}-${random}`
}

export class CreateTransactionUseCase {
  constructor(private transactionRepo: ITransactionRepository) {}

  async execute(dto: CreateTransactionDTO): Promise<Transaction> {
    const transaction = new Transaction({
      orderNumber: generateOrderNumber(),
      customer: dto.customer,
      items: dto.items,
    })
    return this.transactionRepo.create(transaction)
  }
}
```

`apps/backend/src/application/use-cases/transactions/GetTransactions.ts`:
```ts
import { ITransactionRepository } from '../../../interfaces/repositories/ITransactionRepository'
import { GetTransactionsDTO } from '../../dtos/transaction.dto'

export class GetTransactionsUseCase {
  constructor(private transactionRepo: ITransactionRepository) {}

  async execute(dto: GetTransactionsDTO = {}) {
    return this.transactionRepo.findAll(dto)
  }
}
```

`apps/backend/src/application/use-cases/transactions/UpdateTransactionStatus.ts`:
```ts
import { ITransactionRepository } from '../../../interfaces/repositories/ITransactionRepository'
import { Transaction, TransactionStatus } from '../../../domain/Transaction'

export class UpdateTransactionStatusUseCase {
  constructor(private transactionRepo: ITransactionRepository) {}

  async execute(id: string, status: TransactionStatus): Promise<Transaction> {
    const transaction = await this.transactionRepo.updateStatus(id, status)
    if (!transaction) throw new Error('Transacción no encontrada')
    return transaction
  }
}
```

- [ ] **Step 7: Correr todos los tests unitarios**

```bash
cd apps/backend
npx jest tests/use-cases/ --no-coverage
```

Resultado esperado: PASS — todos los tests de use-cases

- [ ] **Step 8: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): add user and transaction use-cases with tests"
```

---

## Task 9: Infrastructure — AuthService, Controllers y Routes

**Files:**
- Create: `apps/backend/src/infrastructure/services/AuthService.ts`
- Create: `apps/backend/src/infrastructure/controllers/AuthController.ts`
- Create: `apps/backend/src/infrastructure/controllers/ProductController.ts`
- Create: `apps/backend/src/infrastructure/controllers/UserController.ts`
- Create: `apps/backend/src/infrastructure/controllers/TransactionController.ts`
- Create: `apps/backend/src/infrastructure/routes/auth.ts`
- Create: `apps/backend/src/infrastructure/routes/products.ts`
- Create: `apps/backend/src/infrastructure/routes/users.ts`
- Create: `apps/backend/src/infrastructure/routes/transactions.ts`
- Create: `apps/backend/src/infrastructure/middlewares/auth.ts`
- Modify: `apps/backend/src/app.ts`
- Create: `apps/backend/tests/integration/products.test.ts`

**Interfaces:**
- Consumes: todos los use-cases, repositorios, IAuthService
- Produces: API REST completa funcionando, tests de integración con mongodb-memory-server

- [ ] **Step 1: Mover middleware auth existente a infrastructure**

```bash
mkdir -p apps/backend/src/infrastructure/middlewares
mv apps/backend/src/middleware/auth.ts apps/backend/src/infrastructure/middlewares/auth.ts
mv apps/backend/src/middleware/errorHandler.ts apps/backend/src/infrastructure/middlewares/errorHandler.ts
rmdir apps/backend/src/middleware
```

Actualizar imports en `app.ts`:
```ts
import { errorHandler } from './infrastructure/middlewares/errorHandler'
```

- [ ] **Step 2: Crear `apps/backend/src/infrastructure/services/AuthService.ts`**

```ts
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { IAuthService, AuthPayload } from '../../interfaces/services/IAuthService'
import { IUserRepository } from '../../interfaces/repositories/IUserRepository'

export class AuthService implements IAuthService {
  constructor(private userRepo: IUserRepository) {}

  async login(email: string, password: string): Promise<AuthPayload> {
    const user = await this.userRepo.findByEmail(email)
    if (!user) throw new Error('Credenciales incorrectas')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new Error('Credenciales incorrectas')

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )
    const { passwordHash: _, ...userWithoutPassword } = user
    return { token, user: userWithoutPassword }
  }

  async verifyToken(token: string): Promise<{ id: string; role: string }> {
    return jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }
}
```

- [ ] **Step 3: Crear `apps/backend/src/infrastructure/controllers/AuthController.ts`**

```ts
import { Request, Response, NextFunction } from 'express'
import { IAuthService } from '../../interfaces/services/IAuthService'
import { IUserRepository } from '../../interfaces/repositories/IUserRepository'
import { loginSchema } from '@marketplace/shared'

export class AuthController {
  constructor(
    private authService: IAuthService,
    private userRepo: IUserRepository,
  ) {}

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = loginSchema.parse(req.body)
      const result = await this.authService.login(email, password)
      res.json(result)
    } catch (err) { next(err) }
  }

  me = async (req: Request & { userId?: string }, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userRepo.findById(req.userId!)
      if (!user) { res.status(404).json({ message: 'Usuario no encontrado' }); return }
      const { passwordHash: _, ...userWithoutPassword } = user
      res.json(userWithoutPassword)
    } catch (err) { next(err) }
  }

  logout = (_req: Request, res: Response): void => {
    res.json({ message: 'Sesión cerrada' })
  }
}
```

- [ ] **Step 4: Crear `apps/backend/src/infrastructure/controllers/ProductController.ts`**

```ts
import { Request, Response, NextFunction } from 'express'
import { CreateProductUseCase } from '../../application/use-cases/products/CreateProduct'
import { GetProductsUseCase } from '../../application/use-cases/products/GetProducts'
import { GetProductBySlugUseCase } from '../../application/use-cases/products/GetProductBySlug'
import { UpdateProductUseCase } from '../../application/use-cases/products/UpdateProduct'
import { DeleteProductUseCase } from '../../application/use-cases/products/DeleteProduct'
import { createProductSchema, updateProductSchema } from '@marketplace/shared'

export class ProductController {
  constructor(
    private createProduct: CreateProductUseCase,
    private getProducts: GetProductsUseCase,
    private getProductBySlug: GetProductBySlugUseCase,
    private updateProduct: UpdateProductUseCase,
    private deleteProduct: DeleteProductUseCase,
  ) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getProducts.execute({
        category: req.query.category as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      })
      res.json(result)
    } catch (err) { next(err) }
  }

  getBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await this.getProductBySlug.execute(req.params.slug)
      res.json(product)
    } catch (err) {
      if ((err as Error).message === 'Producto no encontrado') {
        res.status(404).json({ message: 'Producto no encontrado' }); return
      }
      next(err)
    }
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = createProductSchema.parse(req.body)
      const product = await this.createProduct.execute(dto)
      res.status(201).json(product)
    } catch (err) { next(err) }
  }

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = updateProductSchema.parse(req.body)
      const product = await this.updateProduct.execute(req.params.id, dto)
      res.json(product)
    } catch (err) { next(err) }
  }

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.deleteProduct.execute(req.params.id)
      res.json({ message: 'Producto desactivado' })
    } catch (err) { next(err) }
  }
}
```

- [ ] **Step 5: Crear controllers para User y Transaction**

`apps/backend/src/infrastructure/controllers/UserController.ts`:
```ts
import { Request, Response, NextFunction } from 'express'
import { CreateUserUseCase } from '../../application/use-cases/users/CreateUser'
import { GetUsersUseCase } from '../../application/use-cases/users/GetUsers'
import { UpdateUserUseCase } from '../../application/use-cases/users/UpdateUser'
import { DeleteUserUseCase } from '../../application/use-cases/users/DeleteUser'
import { createUserSchema, updateUserSchema } from '@marketplace/shared'

export class UserController {
  constructor(
    private createUser: CreateUserUseCase,
    private getUsers: GetUsersUseCase,
    private updateUser: UpdateUserUseCase,
    private deleteUser: DeleteUserUseCase,
  ) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getUsers.execute(
        req.query.page ? parseInt(req.query.page as string) : undefined,
        req.query.limit ? parseInt(req.query.limit as string) : undefined,
      )
      res.json(result)
    } catch (err) { next(err) }
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = createUserSchema.parse(req.body)
      const user = await this.createUser.execute(dto)
      const { passwordHash: _, ...userWithoutPassword } = user
      res.status(201).json(userWithoutPassword)
    } catch (err) { next(err) }
  }

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = updateUserSchema.parse(req.body)
      const user = await this.updateUser.execute(req.params.id, dto)
      res.json(user)
    } catch (err) { next(err) }
  }

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.deleteUser.execute(req.params.id)
      res.json({ message: 'Usuario eliminado' })
    } catch (err) { next(err) }
  }
}
```

`apps/backend/src/infrastructure/controllers/TransactionController.ts`:
```ts
import { Request, Response, NextFunction } from 'express'
import { CreateTransactionUseCase } from '../../application/use-cases/transactions/CreateTransaction'
import { GetTransactionsUseCase } from '../../application/use-cases/transactions/GetTransactions'
import { UpdateTransactionStatusUseCase } from '../../application/use-cases/transactions/UpdateTransactionStatus'
import { createTransactionSchema, updateTransactionStatusSchema } from '@marketplace/shared'
import { TransactionStatus } from '../../domain/Transaction'

export class TransactionController {
  constructor(
    private createTransaction: CreateTransactionUseCase,
    private getTransactions: GetTransactionsUseCase,
    private updateStatus: UpdateTransactionStatusUseCase,
  ) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getTransactions.execute({
        status: req.query.status as TransactionStatus,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
      })
      res.json(result)
    } catch (err) { next(err) }
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = createTransactionSchema.parse(req.body)
      const transaction = await this.createTransaction.execute(dto)
      res.status(201).json(transaction)
    } catch (err) { next(err) }
  }

  updateTransactionStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = updateTransactionStatusSchema.parse(req.body)
      const transaction = await this.updateStatus.execute(req.params.id, status)
      res.json(transaction)
    } catch (err) { next(err) }
  }
}
```

- [ ] **Step 6: Crear routes con dependency injection**

`apps/backend/src/infrastructure/routes/products.ts`:
```ts
import { Router } from 'express'
import { requireAuth } from '../middlewares/auth'
import { MongoProductRepository } from '../repositories/MongoProductRepository'
import { ProductController } from '../controllers/ProductController'
import { CreateProductUseCase } from '../../application/use-cases/products/CreateProduct'
import { GetProductsUseCase } from '../../application/use-cases/products/GetProducts'
import { GetProductBySlugUseCase } from '../../application/use-cases/products/GetProductBySlug'
import { UpdateProductUseCase } from '../../application/use-cases/products/UpdateProduct'
import { DeleteProductUseCase } from '../../application/use-cases/products/DeleteProduct'

const repo = new MongoProductRepository()
const controller = new ProductController(
  new CreateProductUseCase(repo),
  new GetProductsUseCase(repo),
  new GetProductBySlugUseCase(repo),
  new UpdateProductUseCase(repo),
  new DeleteProductUseCase(repo),
)

const router = Router()
router.get('/', controller.list)
router.get('/:slug', controller.getBySlug)
router.post('/', requireAuth, controller.create)
router.put('/:id', requireAuth, controller.update)
router.delete('/:id', requireAuth, controller.remove)

export default router
```

`apps/backend/src/infrastructure/routes/users.ts`:
```ts
import { Router } from 'express'
import { requireAuth } from '../middlewares/auth'
import { MongoUserRepository } from '../repositories/MongoUserRepository'
import { AuthService } from '../services/AuthService'
import { UserController } from '../controllers/UserController'
import { CreateUserUseCase } from '../../application/use-cases/users/CreateUser'
import { GetUsersUseCase } from '../../application/use-cases/users/GetUsers'
import { UpdateUserUseCase } from '../../application/use-cases/users/UpdateUser'
import { DeleteUserUseCase } from '../../application/use-cases/users/DeleteUser'

const userRepo = new MongoUserRepository()
const authService = new AuthService(userRepo)
const controller = new UserController(
  new CreateUserUseCase(userRepo, authService),
  new GetUsersUseCase(userRepo),
  new UpdateUserUseCase(userRepo),
  new DeleteUserUseCase(userRepo),
)

const router = Router()
router.get('/', requireAuth, controller.list)
router.post('/', requireAuth, controller.create)
router.put('/:id', requireAuth, controller.update)
router.delete('/:id', requireAuth, controller.remove)

export default router
```

`apps/backend/src/infrastructure/routes/transactions.ts`:
```ts
import { Router } from 'express'
import { requireAuth } from '../middlewares/auth'
import { MongoTransactionRepository } from '../repositories/MongoTransactionRepository'
import { TransactionController } from '../controllers/TransactionController'
import { CreateTransactionUseCase } from '../../application/use-cases/transactions/CreateTransaction'
import { GetTransactionsUseCase } from '../../application/use-cases/transactions/GetTransactions'
import { UpdateTransactionStatusUseCase } from '../../application/use-cases/transactions/UpdateTransactionStatus'

const repo = new MongoTransactionRepository()
const controller = new TransactionController(
  new CreateTransactionUseCase(repo),
  new GetTransactionsUseCase(repo),
  new UpdateTransactionStatusUseCase(repo),
)

const router = Router()
router.get('/', requireAuth, controller.list)
router.post('/', controller.create)
router.patch('/:id/status', requireAuth, controller.updateTransactionStatus)

export default router
```

`apps/backend/src/infrastructure/routes/auth.ts`:
```ts
import { Router } from 'express'
import { requireAuth } from '../middlewares/auth'
import { MongoUserRepository } from '../repositories/MongoUserRepository'
import { AuthService } from '../services/AuthService'
import { AuthController } from '../controllers/AuthController'

const userRepo = new MongoUserRepository()
const authService = new AuthService(userRepo)
const controller = new AuthController(authService, userRepo)

const router = Router()
router.post('/login', controller.login)
router.get('/me', requireAuth, controller.me)
router.post('/logout', controller.logout)

export default router
```

- [ ] **Step 7: Registrar rutas en `apps/backend/src/app.ts`**

```ts
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { errorHandler } from './infrastructure/middlewares/errorHandler'
import authRouter from './infrastructure/routes/auth'
import productsRouter from './infrastructure/routes/products'
import usersRouter from './infrastructure/routes/users'
import transactionsRouter from './infrastructure/routes/transactions'

export function createApp() {
  const app = express()
  app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }))
  app.use(express.json())
  app.use(morgan('dev'))

  app.get('/health', (_req, res) => { res.json({ status: 'ok' }) })
  app.use('/api/auth', authRouter)
  app.use('/api/products', productsRouter)
  app.use('/api/users', usersRouter)
  app.use('/api/transactions', transactionsRouter)

  app.use(errorHandler)
  return app
}
```

- [ ] **Step 8: Crear test de integración**

`apps/backend/tests/integration/products.test.ts`:
```ts
import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { createApp } from '../../src/app'
import { UserModel } from '../../src/infrastructure/models/UserModel'
import { ProductModel } from '../../src/infrastructure/models/ProductModel'

let mongod: MongoMemoryServer
let app: ReturnType<typeof createApp>
let adminToken: string

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
  app = createApp()
  process.env.JWT_SECRET = 'test-secret'

  const hash = await bcrypt.hash('pass123', 10)
  await UserModel.create({ name: 'Admin', email: 'admin@test.com', passwordHash: hash, role: 'admin' })
  const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'pass123' })
  adminToken = res.body.token
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

afterEach(async () => { await ProductModel.deleteMany({}) })

describe('GET /api/products', () => {
  it('returns only active products', async () => {
    await ProductModel.create({ name: 'A', slug: 'a', description: 'desc desc desc', price: 10, stock: 1, category: 'cat', active: true })
    await ProductModel.create({ name: 'B', slug: 'b', description: 'desc desc desc', price: 10, stock: 1, category: 'cat', active: false })
    const res = await request(app).get('/api/products')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })
})

describe('POST /api/products', () => {
  it('requires auth', async () => {
    const res = await request(app).post('/api/products').send({})
    expect(res.status).toBe(401)
  })

  it('creates product with slug generated from name', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Laptop Pro', description: 'Una laptop muy buena', price: 999, stock: 10, category: 'electronics' })
    expect(res.status).toBe(201)
    expect(res.body.slug).toBe('laptop-pro')
  })
})

describe('DELETE /api/products/:id', () => {
  it('soft deletes product', async () => {
    const product = await ProductModel.create({ name: 'X', slug: 'x', description: 'desc desc desc', price: 10, stock: 1, category: 'c' })
    await request(app).delete(`/api/products/${product._id}`).set('Authorization', `Bearer ${adminToken}`)
    const found = await ProductModel.findById(product._id)
    expect(found?.active).toBe(false)
  })
})
```

- [ ] **Step 9: Correr todos los tests**

```bash
cd apps/backend
npx jest --no-coverage
```

Resultado esperado: PASS — tests unitarios + integración

- [ ] **Step 10: Crear seed script**

`apps/backend/src/infrastructure/scripts/seed.ts`:
```ts
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { connectDB, disconnectDB } from '../config/db'
import { UserModel } from '../models/UserModel'

async function seed() {
  await connectDB(process.env.MONGODB_URI!)
  const hash = await bcrypt.hash('admin123', 10)
  await UserModel.findOneAndUpdate(
    { email: 'admin@marketplace.com' },
    { name: 'Admin', email: 'admin@marketplace.com', passwordHash: hash, role: 'admin' },
    { upsert: true }
  )
  console.log('Admin: admin@marketplace.com / admin123')
  await disconnectDB()
}

seed().catch(console.error)
```

Agregar a `apps/backend/package.json`:
```json
"seed": "tsx src/infrastructure/scripts/seed.ts"
```

- [ ] **Step 11: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): add controllers, routes, auth service and integration tests"
```

---

## Task 10: Frontend — Setup Auth.js v5, TanStack Query y API client

*(Igual al plan anterior — sin cambios)*

**Files:**
- Modify: `apps/frontend/package.json`
- Create: `apps/frontend/auth.ts`
- Create: `apps/frontend/middleware.ts`
- Create: `apps/frontend/lib/api.ts`
- Create: `apps/frontend/lib/query-client.ts`
- Create: `apps/frontend/providers.tsx`
- Modify: `apps/frontend/app/layout.tsx`

- [ ] **Step 1: Instalar dependencias**

```bash
cd apps/frontend
npm install next-auth@beta @tanstack/react-query react-hook-form @hookform/resolvers zod
npm install -D @tanstack/react-query-devtools
```

- [ ] **Step 2: Instalar shadcn/ui**

```bash
cd apps/frontend
npx shadcn@latest init
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

export const config = { matcher: ['/admin/:path*'] }
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
  defaultOptions: { queries: { staleTime: 1000 * 60 } },
})
```

- [ ] **Step 7: Crear `apps/frontend/providers.tsx`**

```tsx
'use client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/query-client'

export function Providers({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

- [ ] **Step 8: Actualizar `apps/frontend/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '../providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = { title: 'Marketplace', description: 'Portfolio project' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}><Providers>{children}</Providers></body>
    </html>
  )
}
```

- [ ] **Step 9: Crear `apps/frontend/types/next-auth.d.ts`**

```ts
import 'next-auth'
declare module 'next-auth' {
  interface Session {
    user: { accessToken: string; role: string; name?: string | null; email?: string | null }
  }
}
```

- [ ] **Step 10: Crear `.env.local`**

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
BACKEND_URL=http://localhost:4000
AUTH_SECRET=change_this_secret_32_chars_min
```

- [ ] **Step 11: Commit**

```bash
git add apps/frontend
git commit -m "feat(frontend): setup Auth.js v5, TanStack Query and API client"
```

---

## Tasks 11-14: Frontend Pages

*(Idéntico al plan anterior — Tasks 10-14 del plan v1)*

Estas tasks no cambian porque el frontend consume la API REST sin saber nada de la arquitectura interna del backend.

- **Task 11:** Login page (`/login`)
- **Task 12:** Admin layout + Dashboard
- **Task 13:** Admin Products CRUD (ProductTable, ProductForm, páginas /admin/products)
- **Task 14:** Admin Users y Transactions (UserTable, UserForm, TransactionTable)
- **Task 15:** Vitrina pública y Checkout Modal (ProductCard, páginas store)

Ver implementación completa de estas tasks en el plan original:
`docs/superpowers/plans/2026-06-19-marketplace-implementation.md` — Tasks 10 a 14.

---

## Task 16: Docker Compose, Vercel y Railway

**Files:**
- Create: `apps/backend/Dockerfile`
- Create: `apps/frontend/Dockerfile` (solo para desarrollo local)
- Create: `docker-compose.yml`
- Create: `.env.example` (raíz)
- Create: `railway.json`
- Create: `vercel.json` (si necesario)
- Create: `README.md`

**Interfaces:**
- Produces: `docker compose up --build` levanta stack completo localmente
- Produces: instrucciones de deploy en Railway (backend) y Vercel (frontend)

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

- [ ] **Step 2: Crear `docker-compose.yml` en raíz**

```yaml
services:
  mongo:
    image: mongo:7
    restart: unless-stopped
    ports: ["27017:27017"]
    volumes: [mongo_data:/data/db]
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./apps/backend
    restart: unless-stopped
    ports: ["4000:4000"]
    environment:
      - MONGODB_URI=mongodb://mongo:27017/marketplace
      - JWT_SECRET=${JWT_SECRET}
      - PORT=4000
      - FRONTEND_URL=http://localhost:3000
    depends_on:
      mongo:
        condition: service_healthy

volumes:
  mongo_data:
```

- [ ] **Step 3: Crear `railway.json` para deploy del backend**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "apps/backend/Dockerfile"
  },
  "deploy": {
    "startCommand": "node dist/index.js",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

- [ ] **Step 4: Crear `.env.example` raíz**

```
JWT_SECRET=your_jwt_secret_min_32_chars
# Para Docker Compose local
MONGO_INITDB_DATABASE=marketplace
```

- [ ] **Step 5: Crear `README.md`**

```markdown
# Marketplace Portfolio

Tienda de artículos fullstack con Next.js 15, Express (Clean Architecture), MongoDB y Docker.

## Stack

- **Frontend:** Next.js 15, Auth.js v5, TailwindCSS, shadcn/ui, TanStack Query → **Vercel**
- **Backend:** Express, TypeScript, Clean Architecture (Domain/Interfaces/Application/Infrastructure) → **Railway**
- **DB:** MongoDB 7 → **MongoDB Atlas M0**
- **Infra local:** Docker Compose, Turborepo

## Arquitectura del Backend

```
domain/          ← entidades puras (sin dependencias)
interfaces/      ← contratos TypeScript (IRepository, IService)
application/     ← casos de uso (orquestan lógica)
infrastructure/  ← Express, Mongoose, JWT (implementaciones concretas)
```

## Quickstart local

```bash
cp .env.example .env
docker compose up mongo -d   # solo MongoDB
npm install
turbo dev                    # frontend :3000, backend :4000
```

## Deploy

### MongoDB Atlas
1. Crear cluster M0 gratuito en atlas.mongodb.com
2. Copiar connection string

### Backend → Railway
1. Conectar repo en railway.app
2. Variables: `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`
3. Railway detecta `railway.json` automáticamente

### Frontend → Vercel
1. Conectar repo en vercel.com, seleccionar `apps/frontend`
2. Variables: `NEXT_PUBLIC_BACKEND_URL` (URL de Railway), `BACKEND_URL` (URL de Railway), `AUTH_SECRET`

## Tests

```bash
cd apps/backend
npm test
```
```

- [ ] **Step 6: Commit final**

```bash
git add .
git commit -m "feat: add Docker Compose, Railway config and README"
```

---

## Checklist de cobertura

- [x] Monorepo Turborepo
- [x] Shared types y Zod schemas
- [x] Clean Architecture: domain → interfaces → application → infrastructure
- [x] Tests unitarios de use-cases (sin DB)
- [x] Tests de integración con mongodb-memory-server
- [x] Auth.js v5 frontend + JWT backend
- [x] CRUD productos con soft delete
- [x] CRUD usuarios
- [x] Transacciones simuladas con checkout modal
- [x] Cambio de status desde admin
- [x] Paginación en listados
- [x] Frontend en Vercel, backend en Railway, MongoDB en Atlas
- [x] Docker Compose para desarrollo local
- [x] README con instrucciones claras
