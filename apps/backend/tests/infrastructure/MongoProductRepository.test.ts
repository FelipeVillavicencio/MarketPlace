import mongoose from 'mongoose'
import { connectTestDB, disconnectTestDB, clearTestDB } from './testSetup'
import { MongoProductRepository } from '../../src/infrastructure/repositories/MongoProductRepository'
import { Product } from '../../src/domain/Product'

beforeAll(async () => {
  await connectTestDB()
}, 30000)

afterAll(async () => {
  await disconnectTestDB()
}, 30000)

afterEach(async () => {
  await clearTestDB()
})

function makeProduct(overrides: Partial<ConstructorParameters<typeof Product>[0]> = {}): Product {
  return new Product({
    name: 'Test Product',
    slug: 'test-product',
    description: 'A test product',
    price: 99.99,
    stock: 10,
    category: 'electronics',
    ...overrides,
  })
}

describe('MongoProductRepository', () => {
  let repo: MongoProductRepository

  beforeEach(() => {
    repo = new MongoProductRepository()
  })

  test('creates a product and returns it with an _id', async () => {
    const product = makeProduct()
    const saved = await repo.create(product)

    expect(saved._id).toBeDefined()
    expect(saved.name).toBe('Test Product')
    expect(saved.slug).toBe('test-product')
    expect(saved.price).toBe(99.99)
    expect(saved.stock).toBe(10)
    expect(saved.active).toBe(true)
  })

  test('findById returns the product by id', async () => {
    const saved = await repo.create(makeProduct())
    const found = await repo.findById(saved._id!)

    expect(found).not.toBeNull()
    expect(found!._id).toBe(saved._id)
    expect(found!.name).toBe('Test Product')
  })

  test('findById returns null for non-existent id', async () => {
    const result = await repo.findById(new mongoose.Types.ObjectId().toString())
    expect(result).toBeNull()
  })

  test('findBySlug returns the product by slug', async () => {
    await repo.create(makeProduct({ slug: 'my-slug' }))
    const found = await repo.findBySlug('my-slug')

    expect(found).not.toBeNull()
    expect(found!.slug).toBe('my-slug')
  })

  test('findBySlug returns null for unknown slug', async () => {
    const result = await repo.findBySlug('ghost-slug')
    expect(result).toBeNull()
  })

  test('findAll returns all products with pagination', async () => {
    await repo.create(makeProduct({ name: 'Product A', slug: 'product-a' }))
    await repo.create(makeProduct({ name: 'Product B', slug: 'product-b' }))

    const result = await repo.findAll({ page: 1, limit: 10 })

    expect(result.total).toBe(2)
    expect(result.data.length).toBe(2)
    expect(result.page).toBe(1)
    expect(result.pages).toBe(1)
  })

  test('findAll filters by active status', async () => {
    await repo.create(makeProduct({ name: 'Active', slug: 'active', active: true }))
    const inactive = await repo.create(makeProduct({ name: 'Inactive', slug: 'inactive', active: true }))
    await repo.softDelete(inactive._id!)

    const result = await repo.findAll({ active: true })
    expect(result.data.every((p: Product) => p.active)).toBe(true)
    expect(result.total).toBe(1)
  })

  test('findAll filters by category', async () => {
    await repo.create(makeProduct({ name: 'Laptop', slug: 'laptop', category: 'electronics' }))
    await repo.create(makeProduct({ name: 'Shirt', slug: 'shirt', category: 'clothing' }))

    const result = await repo.findAll({ category: 'electronics' })
    expect(result.total).toBe(1)
    expect(result.data[0].category).toBe('electronics')
  })

  test('findAll filters by search (name)', async () => {
    await repo.create(makeProduct({ name: 'Blue Laptop', slug: 'blue-laptop' }))
    await repo.create(makeProduct({ name: 'Red Shirt', slug: 'red-shirt' }))

    const result = await repo.findAll({ search: 'Laptop' })
    expect(result.total).toBe(1)
    expect(result.data[0].name).toBe('Blue Laptop')
  })

  test('update changes fields and returns the updated product', async () => {
    const saved = await repo.create(makeProduct())
    const updated = await repo.update(saved._id!, { price: 199.99, stock: 5 })

    expect(updated).not.toBeNull()
    expect(updated!.price).toBe(199.99)
    expect(updated!.stock).toBe(5)
  })

  test('update returns null for non-existent id', async () => {
    const result = await repo.update(new mongoose.Types.ObjectId().toString(), { price: 10 })
    expect(result).toBeNull()
  })

  test('softDelete sets active to false', async () => {
    const saved = await repo.create(makeProduct())
    const deleted = await repo.softDelete(saved._id!)

    expect(deleted).not.toBeNull()
    expect(deleted!.active).toBe(false)
  })

  test('softDelete returns null for non-existent id', async () => {
    const result = await repo.softDelete(new mongoose.Types.ObjectId().toString())
    expect(result).toBeNull()
  })
})
