/**
 * Tests for repository and service interfaces.
 * Since interfaces are purely TypeScript contracts (no runtime code),
 * these tests verify structural compliance via mock implementations.
 */

import { Product } from '../../src/domain/Product'
import { User } from '../../src/domain/User'
import { Transaction, TransactionStatus } from '../../src/domain/Transaction'
import {
  IProductRepository,
  ProductFilters,
  PaginatedResult,
} from '../../src/interfaces/repositories/IProductRepository'
import { IUserRepository, UserFilters } from '../../src/interfaces/repositories/IUserRepository'
import {
  ITransactionRepository,
  TransactionFilters,
} from '../../src/interfaces/repositories/ITransactionRepository'
import { IAuthService, AuthPayload } from '../../src/interfaces/services/IAuthService'

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeProduct(overrides: Partial<ConstructorParameters<typeof Product>[0]> = {}): Product {
  return new Product({
    _id: 'p1',
    name: 'Test Product',
    slug: 'test-product',
    description: 'A product',
    price: 10,
    stock: 5,
    category: 'electronics',
    ...overrides,
  })
}

function makeUser(overrides: Partial<ConstructorParameters<typeof User>[0]> = {}): User {
  return new User({
    _id: 'u1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hash123',
    ...overrides,
  })
}

function makeTransaction(): Transaction {
  return new Transaction({
    _id: 't1',
    orderNumber: 'ORD-001',
    customer: { name: 'Test User', email: 'test@example.com' },
    items: [{ productId: 'p1', name: 'Test Product', price: 10, quantity: 2 }],
  })
}

// ─── Mock implementations ────────────────────────────────────────────────────

class MockProductRepository implements IProductRepository {
  async create(product: Product): Promise<Product> { return product }
  async findById(id: string): Promise<Product | null> { return id === 'p1' ? makeProduct() : null }
  async findBySlug(slug: string): Promise<Product | null> { return slug === 'test-product' ? makeProduct() : null }
  async findAll(filters: ProductFilters): Promise<PaginatedResult<Product>> {
    return { data: [makeProduct()], total: 1, page: filters.page ?? 1, pages: 1 }
  }
  async update(id: string, data: Partial<Omit<Product, '_id' | 'createdAt' | 'updatedAt'>>): Promise<Product | null> {
    return id === 'p1' ? makeProduct(data as any) : null
  }
  async softDelete(id: string): Promise<Product | null> { return id === 'p1' ? makeProduct({ active: false }) : null }
}

class MockUserRepository implements IUserRepository {
  async create(user: User): Promise<User> { return user }
  async findById(id: string): Promise<User | null> { return id === 'u1' ? makeUser() : null }
  async findByEmail(email: string): Promise<User | null> { return email === 'test@example.com' ? makeUser() : null }
  async findAll(filters: UserFilters): Promise<{ data: User[]; total: number }> {
    return { data: [makeUser()], total: 1 }
  }
  async update(id: string, data: Partial<Omit<User, '_id' | 'createdAt' | 'updatedAt'>>): Promise<User | null> {
    return id === 'u1' ? makeUser(data as any) : null
  }
  async delete(id: string): Promise<boolean> { return id === 'u1' }
}

class MockTransactionRepository implements ITransactionRepository {
  async create(transaction: Transaction): Promise<Transaction> { return transaction }
  async findById(id: string): Promise<Transaction | null> { return id === 't1' ? makeTransaction() : null }
  async findAll(filters: TransactionFilters): Promise<{ data: Transaction[]; total: number }> {
    return { data: [makeTransaction()], total: 1 }
  }
  async updateStatus(id: string, status: TransactionStatus): Promise<Transaction | null> {
    if (id !== 't1') return null
    return new Transaction({
      _id: 't1',
      orderNumber: 'ORD-001',
      customer: { name: 'Test User', email: 'test@example.com' },
      items: [{ productId: 'p1', name: 'Test Product', price: 10, quantity: 2 }],
      status,
    })
  }
}

class MockAuthService implements IAuthService {
  async login(email: string, password: string): Promise<AuthPayload> {
    const user = makeUser({ email })
    const { passwordHash, ...userWithoutHash } = user
    return { token: 'mock-token', user: userWithoutHash }
  }
  async verifyToken(token: string): Promise<{ id: string; role: string }> {
    if (token !== 'mock-token') throw new Error('Invalid token')
    return { id: 'u1', role: 'customer' }
  }
  async hashPassword(password: string): Promise<string> {
    return `hashed_${password}`
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('IProductRepository', () => {
  let repo: IProductRepository

  beforeEach(() => { repo = new MockProductRepository() })

  it('create returns the product', async () => {
    const p = makeProduct()
    const result = await repo.create(p)
    expect(result).toBe(p)
  })

  it('findById returns product for known id', async () => {
    const result = await repo.findById('p1')
    expect(result).toBeInstanceOf(Product)
  })

  it('findById returns null for unknown id', async () => {
    const result = await repo.findById('unknown')
    expect(result).toBeNull()
  })

  it('findBySlug returns product for known slug', async () => {
    const result = await repo.findBySlug('test-product')
    expect(result).toBeInstanceOf(Product)
  })

  it('findBySlug returns null for unknown slug', async () => {
    const result = await repo.findBySlug('missing')
    expect(result).toBeNull()
  })

  it('findAll returns paginated result', async () => {
    const result = await repo.findAll({ page: 2, limit: 10 })
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(result).toHaveProperty('page', 2)
    expect(result).toHaveProperty('pages')
    expect(Array.isArray(result.data)).toBe(true)
  })

  it('update returns updated product for known id', async () => {
    const result = await repo.update('p1', { price: 99 })
    expect(result).toBeInstanceOf(Product)
  })

  it('update returns null for unknown id', async () => {
    const result = await repo.update('unknown', { price: 99 })
    expect(result).toBeNull()
  })

  it('softDelete returns product with active=false for known id', async () => {
    const result = await repo.softDelete('p1')
    expect(result).toBeInstanceOf(Product)
    expect(result!.active).toBe(false)
  })

  it('softDelete returns null for unknown id', async () => {
    const result = await repo.softDelete('unknown')
    expect(result).toBeNull()
  })
})

describe('IUserRepository', () => {
  let repo: IUserRepository

  beforeEach(() => { repo = new MockUserRepository() })

  it('create returns the user', async () => {
    const u = makeUser()
    const result = await repo.create(u)
    expect(result).toBe(u)
  })

  it('findById returns user for known id', async () => {
    const result = await repo.findById('u1')
    expect(result).toBeInstanceOf(User)
  })

  it('findById returns null for unknown id', async () => {
    expect(await repo.findById('unknown')).toBeNull()
  })

  it('findByEmail returns user for known email', async () => {
    const result = await repo.findByEmail('test@example.com')
    expect(result).toBeInstanceOf(User)
  })

  it('findByEmail returns null for unknown email', async () => {
    expect(await repo.findByEmail('no@one.com')).toBeNull()
  })

  it('findAll returns data array and total', async () => {
    const result = await repo.findAll({})
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.data)).toBe(true)
  })

  it('update returns updated user for known id', async () => {
    const result = await repo.update('u1', { name: 'New Name' })
    expect(result).toBeInstanceOf(User)
  })

  it('update returns null for unknown id', async () => {
    expect(await repo.update('unknown', { name: 'X' })).toBeNull()
  })

  it('delete returns true for known id', async () => {
    expect(await repo.delete('u1')).toBe(true)
  })

  it('delete returns false for unknown id', async () => {
    expect(await repo.delete('unknown')).toBe(false)
  })
})

describe('ITransactionRepository', () => {
  let repo: ITransactionRepository

  beforeEach(() => { repo = new MockTransactionRepository() })

  it('create returns the transaction', async () => {
    const t = makeTransaction()
    const result = await repo.create(t)
    expect(result).toBe(t)
  })

  it('findById returns transaction for known id', async () => {
    const result = await repo.findById('t1')
    expect(result).toBeInstanceOf(Transaction)
  })

  it('findById returns null for unknown id', async () => {
    expect(await repo.findById('unknown')).toBeNull()
  })

  it('findAll returns data array and total', async () => {
    const result = await repo.findAll({})
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.data)).toBe(true)
  })

  it('findAll accepts status filter', async () => {
    const result = await repo.findAll({ status: 'paid' })
    expect(result.data.length).toBeGreaterThanOrEqual(0)
  })

  it('updateStatus updates to paid', async () => {
    const result = await repo.updateStatus('t1', 'paid')
    expect(result).toBeInstanceOf(Transaction)
    expect(result!.status).toBe('paid')
  })

  it('updateStatus updates to cancelled', async () => {
    const result = await repo.updateStatus('t1', 'cancelled')
    expect(result!.status).toBe('cancelled')
  })

  it('updateStatus returns null for unknown id', async () => {
    expect(await repo.updateStatus('unknown', 'paid')).toBeNull()
  })
})

describe('IAuthService', () => {
  let service: IAuthService

  beforeEach(() => { service = new MockAuthService() })

  it('login returns token and user without passwordHash', async () => {
    const result = await service.login('test@example.com', 'pass')
    expect(result).toHaveProperty('token')
    expect(result).toHaveProperty('user')
    expect(result.user).not.toHaveProperty('passwordHash')
  })

  it('login user has expected fields', async () => {
    const { user } = await service.login('test@example.com', 'pass')
    expect(user).toHaveProperty('name')
    expect(user).toHaveProperty('email')
    expect(user).toHaveProperty('role')
  })

  it('verifyToken returns id and role for valid token', async () => {
    const result = await service.verifyToken('mock-token')
    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('role')
  })

  it('verifyToken throws for invalid token', async () => {
    await expect(service.verifyToken('bad-token')).rejects.toThrow()
  })

  it('hashPassword returns a hashed string', async () => {
    const hashed = await service.hashPassword('mypassword')
    expect(typeof hashed).toBe('string')
    expect(hashed).not.toBe('mypassword')
  })
})
