# Task 9: Controllers, Routes & Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the marketplace backend's Clean Architecture layers into HTTP endpoints with JWT auth, controllers, and route files, making the API fully functional.

**Architecture:** Controllers live in `infrastructure/controllers/`, routes in `infrastructure/routes/`, and middlewares in `infrastructure/middlewares/`. AuthService implements IAuthService using bcryptjs + jsonwebtoken. All routes are registered in app.ts. Integration tests use supertest + mongodb-memory-server.

**Tech Stack:** Express, TypeScript, jsonwebtoken, bcryptjs, zod, mongoose, supertest, Jest, mongodb-memory-server

## Global Constraints

- Package manager: pnpm (never npm)
- No `any` types anywhere
- All 90 existing tests must keep passing
- Test runner: `cd apps/backend && pnpm test`
- Branch: `feat/task-9-controllers-routes-auth`
- Auth middleware goes in `apps/backend/src/infrastructure/middlewares/auth.ts`
- errorHandler moves to `apps/backend/src/infrastructure/middlewares/errorHandler.ts`
- Controllers: `apps/backend/src/infrastructure/controllers/`
- Routes: `apps/backend/src/infrastructure/routes/`

---

### Task 1: Move errorHandler + create missing use-cases

**Files:**
- Create: `apps/backend/src/infrastructure/middlewares/errorHandler.ts`
- Modify: `apps/backend/src/app.ts` (update import)
- Create: `apps/backend/src/application/use-cases/users/GetUserById.ts`
- Create: `apps/backend/src/application/use-cases/transactions/GetTransactionById.ts`

**Interfaces:**
- Produces: `GetUserByIdUseCase.execute(id: string): Promise<User>`, `GetTransactionByIdUseCase.execute(id: string): Promise<Transaction>`

- [ ] **Step 1: Copy errorHandler to new location**

Create `apps/backend/src/infrastructure/middlewares/errorHandler.ts`:
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

- [ ] **Step 2: Create GetUserById use-case**

Create `apps/backend/src/application/use-cases/users/GetUserById.ts`:
```ts
import { IUserRepository } from '../../../interfaces/repositories/IUserRepository'
import { User } from '../../../domain/User'

export class GetUserByIdUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(id: string): Promise<User> {
    const user = await this.userRepo.findById(id)
    if (!user) throw new Error('User not found')
    return user
  }
}
```

- [ ] **Step 3: Create GetTransactionById use-case**

Create `apps/backend/src/application/use-cases/transactions/GetTransactionById.ts`:
```ts
import { ITransactionRepository } from '../../../interfaces/repositories/ITransactionRepository'
import { Transaction } from '../../../domain/Transaction'

export class GetTransactionByIdUseCase {
  constructor(private transactionRepo: ITransactionRepository) {}

  async execute(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepo.findById(id)
    if (!transaction) throw new Error('Transaction not found')
    return transaction
  }
}
```

- [ ] **Step 4: Run existing tests to confirm nothing broken**

Run: `cd apps/backend && pnpm test`
Expected: 90 tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/infrastructure/middlewares/errorHandler.ts apps/backend/src/application/use-cases/users/GetUserById.ts apps/backend/src/application/use-cases/transactions/GetTransactionById.ts
git commit -m "feat: add GetUserById, GetTransactionById use-cases and move errorHandler"
```

---

### Task 2: AuthService

**Files:**
- Create: `apps/backend/src/infrastructure/services/AuthService.ts`

**Interfaces:**
- Consumes: `IAuthService` from `interfaces/services/IAuthService.ts`, `IUserRepository.findByEmail()`, `bcryptjs`, `jsonwebtoken`
- Produces: `AuthService` class implementing `IAuthService` — `login(email, password): Promise<AuthPayload>`, `verifyToken(token): Promise<{id: string, role: string}>`, `hashPassword(password): Promise<string>`

- [ ] **Step 1: Create AuthService**

Create `apps/backend/src/infrastructure/services/AuthService.ts`:
```ts
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { IAuthService, AuthPayload } from '../../interfaces/services/IAuthService'
import { IUserRepository } from '../../interfaces/repositories/IUserRepository'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const JWT_EXPIRES_IN = '7d'

export class AuthService implements IAuthService {
  constructor(private userRepo: IUserRepository) {}

  async login(email: string, password: string): Promise<AuthPayload> {
    const user = await this.userRepo.findByEmail(email)
    if (!user) throw new Error('Credenciales inválidas')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new Error('Credenciales inválidas')

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    const { passwordHash: _pw, ...userWithoutPassword } = user
    return { token, user: userWithoutPassword }
  }

  async verifyToken(token: string): Promise<{ id: string; role: string }> {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; role: string }
    return { id: payload.id, role: payload.role }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }
}
```

- [ ] **Step 2: Run tests**

Run: `cd apps/backend && pnpm test`
Expected: 90 tests pass

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/infrastructure/services/AuthService.ts
git commit -m "feat: implement AuthService with bcrypt + JWT"
```

---

### Task 3: Auth middleware

**Files:**
- Create: `apps/backend/src/infrastructure/middlewares/auth.ts`

**Interfaces:**
- Consumes: `AuthService`, `MongoUserRepository`
- Produces: `AuthRequest` interface (extends Request with `userId?: string`, `userRole?: string`), `requireAuth` middleware function

- [ ] **Step 1: Create auth middleware**

Create `apps/backend/src/infrastructure/middlewares/auth.ts`:
```ts
import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/AuthService'
import { MongoUserRepository } from '../repositories/MongoUserRepository'

const userRepo = new MongoUserRepository()
const authService = new AuthService(userRepo)

export interface AuthRequest extends Request {
  userId?: string
  userRole?: string
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No autorizado' })
    return
  }
  const token = authHeader.split(' ')[1]
  try {
    const payload = await authService.verifyToken(token)
    req.userId = payload.id
    req.userRole = payload.role
    next()
  } catch {
    res.status(401).json({ message: 'Token inválido' })
  }
}
```

- [ ] **Step 2: Run tests**

Run: `cd apps/backend && pnpm test`
Expected: 90 tests pass

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/infrastructure/middlewares/auth.ts
git commit -m "feat: add requireAuth middleware"
```

---

### Task 4: AuthController + auth routes

**Files:**
- Create: `apps/backend/src/infrastructure/controllers/AuthController.ts`
- Create: `apps/backend/src/infrastructure/routes/auth.ts`

**Interfaces:**
- Consumes: `AuthService`, `CreateUserUseCase`, `MongoUserRepository`
- Produces: `POST /api/auth/register` → 201 + user, `POST /api/auth/login` → 200 + token + user, `GET /api/auth/me` → 200 + user (requires auth)

- [ ] **Step 1: Create AuthController**

Create `apps/backend/src/infrastructure/controllers/AuthController.ts`:
```ts
import { Response, NextFunction } from 'express'
import { AuthService } from '../services/AuthService'
import { CreateUserUseCase } from '../../application/use-cases/users/CreateUser'
import { GetUserByIdUseCase } from '../../application/use-cases/users/GetUserById'
import { MongoUserRepository } from '../repositories/MongoUserRepository'
import { AuthRequest } from '../middlewares/auth'

const userRepo = new MongoUserRepository()
const authService = new AuthService(userRepo)
const createUser = new CreateUserUseCase(userRepo, authService)
const getUserById = new GetUserByIdUseCase(userRepo)

export class AuthController {
  async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, role } = req.body as {
        name: string
        email: string
        password: string
        role?: 'admin' | 'customer'
      }
      const user = await createUser.execute({ name, email, password, role })
      const { passwordHash: _pw, ...userWithoutPassword } = user
      res.status(201).json(userWithoutPassword)
    } catch (err) {
      next(err)
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body as { email: string; password: string }
      const result = await authService.login(email, password)
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await getUserById.execute(req.userId!)
      const { passwordHash: _pw, ...userWithoutPassword } = user
      res.json(userWithoutPassword)
    } catch (err) {
      next(err)
    }
  }
}
```

- [ ] **Step 2: Create auth routes**

Create `apps/backend/src/infrastructure/routes/auth.ts`:
```ts
import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'
import { requireAuth } from '../middlewares/auth'

const router = Router()
const controller = new AuthController()

router.post('/register', (req, res, next) => controller.register(req, res, next))
router.post('/login', (req, res, next) => controller.login(req, res, next))
router.get('/me', requireAuth, (req, res, next) => controller.me(req, res, next))

export default router
```

- [ ] **Step 3: Run tests**

Run: `cd apps/backend && pnpm test`
Expected: 90 tests pass

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/infrastructure/controllers/AuthController.ts apps/backend/src/infrastructure/routes/auth.ts
git commit -m "feat: add AuthController and auth routes"
```

---

### Task 5: ProductController + products routes

**Files:**
- Create: `apps/backend/src/infrastructure/controllers/ProductController.ts`
- Create: `apps/backend/src/infrastructure/routes/products.ts`

**Interfaces:**
- Consumes: `CreateProductUseCase`, `GetProductsUseCase`, `GetProductBySlugUseCase`, `UpdateProductUseCase`, `DeleteProductUseCase`, `MongoProductRepository`, `requireAuth`
- Produces: `GET /api/products`, `POST /api/products` (auth), `GET /api/products/:slug`, `PUT /api/products/:id` (auth), `DELETE /api/products/:id` (auth)

- [ ] **Step 1: Create ProductController**

Create `apps/backend/src/infrastructure/controllers/ProductController.ts`:
```ts
import { Request, Response, NextFunction } from 'express'
import { MongoProductRepository } from '../repositories/MongoProductRepository'
import { CreateProductUseCase } from '../../application/use-cases/products/CreateProduct'
import { GetProductsUseCase } from '../../application/use-cases/products/GetProducts'
import { GetProductBySlugUseCase } from '../../application/use-cases/products/GetProductBySlug'
import { UpdateProductUseCase } from '../../application/use-cases/products/UpdateProduct'
import { DeleteProductUseCase } from '../../application/use-cases/products/DeleteProduct'

const productRepo = new MongoProductRepository()
const createProduct = new CreateProductUseCase(productRepo)
const getProducts = new GetProductsUseCase(productRepo)
const getProductBySlug = new GetProductBySlugUseCase(productRepo)
const updateProduct = new UpdateProductUseCase(productRepo)
const deleteProduct = new DeleteProductUseCase(productRepo)

export class ProductController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, search, page, limit, includeInactive } = req.query as Record<string, string>
      const result = await getProducts.execute({
        category,
        search,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        includeInactive: includeInactive === 'true',
      })
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await createProduct.execute(req.body as Parameters<typeof createProduct.execute>[0])
      res.status(201).json(product)
    } catch (err) {
      next(err)
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await getProductBySlug.execute(req.params.slug)
      res.json(product)
    } catch (err) {
      next(err)
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await updateProduct.execute(req.params.id, req.body as Parameters<typeof updateProduct.execute>[1])
      res.json(product)
    } catch (err) {
      next(err)
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await deleteProduct.execute(req.params.id)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }
}
```

- [ ] **Step 2: Create products routes**

Create `apps/backend/src/infrastructure/routes/products.ts`:
```ts
import { Router } from 'express'
import { ProductController } from '../controllers/ProductController'
import { requireAuth } from '../middlewares/auth'

const router = Router()
const controller = new ProductController()

router.get('/', (req, res, next) => controller.list(req, res, next))
router.post('/', requireAuth, (req, res, next) => controller.create(req, res, next))
router.get('/:slug', (req, res, next) => controller.getBySlug(req, res, next))
router.put('/:id', requireAuth, (req, res, next) => controller.update(req, res, next))
router.delete('/:id', requireAuth, (req, res, next) => controller.remove(req, res, next))

export default router
```

- [ ] **Step 3: Run tests**

Run: `cd apps/backend && pnpm test`
Expected: 90 tests pass

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/infrastructure/controllers/ProductController.ts apps/backend/src/infrastructure/routes/products.ts
git commit -m "feat: add ProductController and products routes"
```

---

### Task 6: UserController + users routes

**Files:**
- Create: `apps/backend/src/infrastructure/controllers/UserController.ts`
- Create: `apps/backend/src/infrastructure/routes/users.ts`

**Interfaces:**
- Consumes: `GetUsersUseCase`, `GetUserByIdUseCase`, `UpdateUserUseCase`, `DeleteUserUseCase`, `MongoUserRepository`, `requireAuth`, `AuthRequest`
- Produces: `GET /api/users` (auth), `GET /api/users/:id` (auth), `PUT /api/users/:id` (auth), `DELETE /api/users/:id` (auth)

- [ ] **Step 1: Create UserController**

Create `apps/backend/src/infrastructure/controllers/UserController.ts`:
```ts
import { Response, NextFunction } from 'express'
import { MongoUserRepository } from '../repositories/MongoUserRepository'
import { GetUsersUseCase } from '../../application/use-cases/users/GetUsers'
import { GetUserByIdUseCase } from '../../application/use-cases/users/GetUserById'
import { UpdateUserUseCase } from '../../application/use-cases/users/UpdateUser'
import { DeleteUserUseCase } from '../../application/use-cases/users/DeleteUser'
import { AuthRequest } from '../middlewares/auth'

const userRepo = new MongoUserRepository()
const getUsers = new GetUsersUseCase(userRepo)
const getUserById = new GetUserByIdUseCase(userRepo)
const updateUser = new UpdateUserUseCase(userRepo)
const deleteUser = new DeleteUserUseCase(userRepo)

export class UserController {
  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = req.query as Record<string, string>
      const result = await getUsers.execute(page ? Number(page) : 1, limit ? Number(limit) : 20)
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await getUserById.execute(req.params.id)
      const { passwordHash: _pw, ...userWithoutPassword } = user
      res.json(userWithoutPassword)
    } catch (err) {
      next(err)
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await updateUser.execute(req.params.id, req.body as Parameters<typeof updateUser.execute>[1])
      const { passwordHash: _pw, ...userWithoutPassword } = user
      res.json(userWithoutPassword)
    } catch (err) {
      next(err)
    }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await deleteUser.execute(req.params.id)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }
}
```

- [ ] **Step 2: Create users routes**

Create `apps/backend/src/infrastructure/routes/users.ts`:
```ts
import { Router } from 'express'
import { UserController } from '../controllers/UserController'
import { requireAuth } from '../middlewares/auth'

const router = Router()
const controller = new UserController()

router.get('/', requireAuth, (req, res, next) => controller.list(req, res, next))
router.get('/:id', requireAuth, (req, res, next) => controller.getById(req, res, next))
router.put('/:id', requireAuth, (req, res, next) => controller.update(req, res, next))
router.delete('/:id', requireAuth, (req, res, next) => controller.remove(req, res, next))

export default router
```

- [ ] **Step 3: Run tests**

Run: `cd apps/backend && pnpm test`
Expected: 90 tests pass

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/infrastructure/controllers/UserController.ts apps/backend/src/infrastructure/routes/users.ts
git commit -m "feat: add UserController and users routes"
```

---

### Task 7: TransactionController + transactions routes

**Files:**
- Create: `apps/backend/src/infrastructure/controllers/TransactionController.ts`
- Create: `apps/backend/src/infrastructure/routes/transactions.ts`

**Interfaces:**
- Consumes: `CreateTransactionUseCase`, `GetTransactionsUseCase`, `GetTransactionByIdUseCase`, `UpdateTransactionStatusUseCase`, `MongoTransactionRepository`, `requireAuth`, `AuthRequest`
- Produces: `GET /api/transactions` (auth), `POST /api/transactions` (auth), `GET /api/transactions/:id` (auth), `PUT /api/transactions/:id/status` (auth)

- [ ] **Step 1: Create TransactionController**

Create `apps/backend/src/infrastructure/controllers/TransactionController.ts`:
```ts
import { Response, NextFunction } from 'express'
import { MongoTransactionRepository } from '../repositories/MongoTransactionRepository'
import { CreateTransactionUseCase } from '../../application/use-cases/transactions/CreateTransaction'
import { GetTransactionsUseCase } from '../../application/use-cases/transactions/GetTransactions'
import { GetTransactionByIdUseCase } from '../../application/use-cases/transactions/GetTransactionById'
import { UpdateTransactionStatusUseCase } from '../../application/use-cases/transactions/UpdateTransactionStatus'
import { AuthRequest } from '../middlewares/auth'
import { TransactionStatus } from '../../domain/Transaction'

const transactionRepo = new MongoTransactionRepository()
const createTransaction = new CreateTransactionUseCase(transactionRepo)
const getTransactions = new GetTransactionsUseCase(transactionRepo)
const getTransactionById = new GetTransactionByIdUseCase(transactionRepo)
const updateTransactionStatus = new UpdateTransactionStatusUseCase(transactionRepo)

export class TransactionController {
  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, page, limit } = req.query as Record<string, string>
      const result = await getTransactions.execute({
        status: status as TransactionStatus | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      })
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const transaction = await createTransaction.execute(req.body as Parameters<typeof createTransaction.execute>[0])
      res.status(201).json(transaction)
    } catch (err) {
      next(err)
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const transaction = await getTransactionById.execute(req.params.id)
      res.json(transaction)
    } catch (err) {
      next(err)
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body as { status: TransactionStatus }
      const transaction = await updateTransactionStatus.execute(req.params.id, status)
      res.json(transaction)
    } catch (err) {
      next(err)
    }
  }
}
```

- [ ] **Step 2: Create transactions routes**

Create `apps/backend/src/infrastructure/routes/transactions.ts`:
```ts
import { Router } from 'express'
import { TransactionController } from '../controllers/TransactionController'
import { requireAuth } from '../middlewares/auth'

const router = Router()
const controller = new TransactionController()

router.get('/', requireAuth, (req, res, next) => controller.list(req, res, next))
router.post('/', requireAuth, (req, res, next) => controller.create(req, res, next))
router.get('/:id', requireAuth, (req, res, next) => controller.getById(req, res, next))
router.put('/:id/status', requireAuth, (req, res, next) => controller.updateStatus(req, res, next))

export default router
```

- [ ] **Step 3: Run tests**

Run: `cd apps/backend && pnpm test`
Expected: 90 tests pass

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/infrastructure/controllers/TransactionController.ts apps/backend/src/infrastructure/routes/transactions.ts
git commit -m "feat: add TransactionController and transactions routes"
```

---

### Task 8: Wire routes into app.ts

**Files:**
- Modify: `apps/backend/src/app.ts`

**Interfaces:**
- Consumes: all 4 routers, errorHandler from new location

- [ ] **Step 1: Update app.ts**

Replace the content of `apps/backend/src/app.ts` with:
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

- [ ] **Step 2: Run tests**

Run: `cd apps/backend && pnpm test`
Expected: 90 tests pass

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/app.ts
git commit -m "feat: wire all routes into app.ts"
```

---

### Task 9: Integration tests for products

**Files:**
- Create: `apps/backend/tests/integration/products.test.ts`

**Interfaces:**
- Consumes: `createApp()`, `supertest`, `mongodb-memory-server`, `AuthService`, `CreateUserUseCase`, `MongoUserRepository`

- [ ] **Step 1: Create integration test file**

Create `apps/backend/tests/integration/products.test.ts`:
```ts
import request from 'supertest'
import { connectTestDB, disconnectTestDB, clearTestDB } from '../infrastructure/testSetup'
import { createApp } from '../../src/app'
import { MongoUserRepository } from '../../src/infrastructure/repositories/MongoUserRepository'
import { AuthService } from '../../src/infrastructure/services/AuthService'
import { CreateUserUseCase } from '../../src/application/use-cases/users/CreateUser'

const app = createApp()

beforeAll(async () => {
  await connectTestDB()
}, 30000)

afterAll(async () => {
  await disconnectTestDB()
}, 30000)

afterEach(async () => {
  await clearTestDB()
})

async function getAdminToken(): Promise<string> {
  const userRepo = new MongoUserRepository()
  const authService = new AuthService(userRepo)
  const createUser = new CreateUserUseCase(userRepo, authService)
  await createUser.execute({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
  })
  const result = await authService.login('admin@test.com', 'password123')
  return result.token
}

describe('GET /api/products', () => {
  test('returns empty paginated list when no products', async () => {
    const res = await request(app).get('/api/products')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toEqual([])
    expect(res.body).toHaveProperty('total')
  })
})

describe('POST /api/products', () => {
  test('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/products').send({
      name: 'Test Product',
      description: 'A product',
      price: 100,
      stock: 10,
      category: 'electronics',
    })
    expect(res.status).toBe(401)
  })

  test('creates a product with valid token', async () => {
    const token = await getAdminToken()
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Product',
        description: 'A product',
        price: 100,
        stock: 10,
        category: 'electronics',
      })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Test Product')
    expect(res.body.slug).toBe('test-product')
  })
})

describe('GET /api/products/:slug', () => {
  test('returns 500 for non-existent slug', async () => {
    const res = await request(app).get('/api/products/nonexistent-slug')
    expect(res.status).toBe(500)
  })

  test('returns product by slug', async () => {
    const token = await getAdminToken()
    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Slug Product',
        description: 'A product',
        price: 50,
        stock: 5,
        category: 'books',
      })
    const res = await request(app).get('/api/products/slug-product')
    expect(res.status).toBe(200)
    expect(res.body.slug).toBe('slug-product')
  })
})

describe('GET /health', () => {
  test('returns ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})
```

- [ ] **Step 2: Run ALL tests**

Run: `cd apps/backend && pnpm test`
Expected: 90+ tests pass (90 existing + new integration tests)

- [ ] **Step 3: Commit**

```bash
git add apps/backend/tests/integration/products.test.ts
git commit -m "test: add integration tests for products API"
```

---

### Task 10: Seed script

**Files:**
- Create: `apps/backend/src/infrastructure/scripts/seed.ts`

**Interfaces:**
- Consumes: `connectDB`, `MongoUserRepository`, `MongoProductRepository`, `AuthService`, `CreateUserUseCase`, `CreateProductUseCase`

- [ ] **Step 1: Create seed script**

Create `apps/backend/src/infrastructure/scripts/seed.ts`:
```ts
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { MongoUserRepository } from '../repositories/MongoUserRepository'
import { MongoProductRepository } from '../repositories/MongoProductRepository'
import { AuthService } from '../services/AuthService'
import { CreateUserUseCase } from '../../application/use-cases/users/CreateUser'
import { CreateProductUseCase } from '../../application/use-cases/products/CreateProduct'

dotenv.config()

async function seed(): Promise<void> {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/marketplace'
  await mongoose.connect(MONGO_URI)
  console.log('Connected to MongoDB')

  const userRepo = new MongoUserRepository()
  const productRepo = new MongoProductRepository()
  const authService = new AuthService(userRepo)
  const createUser = new CreateUserUseCase(userRepo, authService)
  const createProduct = new CreateProductUseCase(productRepo)

  // Create admin user
  try {
    const admin = await createUser.execute({
      name: 'Admin User',
      email: 'admin@marketplace.com',
      password: 'Admin123!',
      role: 'admin',
    })
    console.log('Admin created:', admin.email)
  } catch (err) {
    console.log('Admin already exists or error:', (err as Error).message)
  }

  // Create sample products
  const sampleProducts = [
    {
      name: 'Laptop Pro 15',
      description: 'High performance laptop for professionals',
      price: 1299.99,
      stock: 50,
      category: 'electronics',
      attributes: { brand: 'TechPro', ram: '16GB', storage: '512GB SSD' },
    },
    {
      name: 'Wireless Headphones',
      description: 'Premium noise-cancelling wireless headphones',
      price: 299.99,
      stock: 100,
      category: 'electronics',
      attributes: { brand: 'SoundMax', connectivity: 'Bluetooth 5.0' },
    },
    {
      name: 'Running Shoes',
      description: 'Lightweight running shoes for everyday training',
      price: 89.99,
      stock: 200,
      category: 'sports',
      attributes: { brand: 'SpeedRun', material: 'mesh' },
    },
  ]

  for (const productData of sampleProducts) {
    try {
      const product = await createProduct.execute(productData)
      console.log('Product created:', product.name)
    } catch (err) {
      console.log('Product error:', (err as Error).message)
    }
  }

  await mongoose.disconnect()
  console.log('Seed complete')
}

seed().catch(console.error)
```

- [ ] **Step 2: Run tests one final time**

Run: `cd apps/backend && pnpm test`
Expected: All tests pass

- [ ] **Step 3: Final commit**

```bash
git add apps/backend/src/infrastructure/scripts/seed.ts
git commit -m "feat: add database seed script"
```
