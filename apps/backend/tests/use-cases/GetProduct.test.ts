import { GetProductUseCase } from '../../src/application/use-cases/products/GetProduct'
import { IProductRepository, PaginatedResult } from '../../src/interfaces/repositories/IProductRepository'
import { Product } from '../../src/domain/Product'

const MONGO_ID = '507f1f77bcf86cd799439011'

const makeRepo = (overrides: Partial<IProductRepository> = {}): IProductRepository => ({
  create: jest.fn().mockImplementation(async (p: Product) => p),
  findById: jest.fn().mockResolvedValue(null),
  findBySlug: jest.fn().mockResolvedValue(null),
  findAll: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, pages: 0 } as PaginatedResult<Product>),
  update: jest.fn().mockResolvedValue(null),
  softDelete: jest.fn().mockResolvedValue(null),
  ...overrides,
})

describe('GetProductUseCase', () => {
  it('looks up by slug when the identifier is not a Mongo id', async () => {
    const product = new Product({ name: 'Laptop Pro', slug: 'laptop-pro', description: 'desc desc desc', price: 999, stock: 1, category: 'x', active: true })
    const findBySlug = jest.fn().mockResolvedValue(product)
    const repo = makeRepo({ findBySlug })
    const useCase = new GetProductUseCase(repo)

    const result = await useCase.execute('laptop-pro')

    expect(findBySlug).toHaveBeenCalledWith('laptop-pro')
    expect(result).toBe(product)
  })

  it('looks up by id when the identifier is a 24-char hex Mongo id', async () => {
    const product = new Product({ _id: MONGO_ID, name: 'Laptop Pro', slug: 'laptop-pro', description: 'desc desc desc', price: 999, stock: 1, category: 'x', active: true })
    const findById = jest.fn().mockResolvedValue(product)
    const repo = makeRepo({ findById })
    const useCase = new GetProductUseCase(repo)

    const result = await useCase.execute(MONGO_ID)

    expect(findById).toHaveBeenCalledWith(MONGO_ID)
    expect(result).toBe(product)
  })

  it('throws for an inactive product looked up by slug (public path)', async () => {
    const inactive = new Product({ name: 'Old', slug: 'old', description: 'desc desc desc', price: 10, stock: 1, category: 'x', active: false })
    const repo = makeRepo({ findBySlug: jest.fn().mockResolvedValue(inactive) })
    const useCase = new GetProductUseCase(repo)

    await expect(useCase.execute('old')).rejects.toThrow('Product not found')
  })

  it('returns an inactive product looked up by id (admin path)', async () => {
    const inactive = new Product({ _id: MONGO_ID, name: 'Old', slug: 'old', description: 'desc desc desc', price: 10, stock: 1, category: 'x', active: false })
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(inactive) })
    const useCase = new GetProductUseCase(repo)

    const result = await useCase.execute(MONGO_ID)

    expect(result).toBe(inactive)
  })

  it('throws when nothing is found', async () => {
    const repo = makeRepo()
    const useCase = new GetProductUseCase(repo)

    await expect(useCase.execute('nonexistent')).rejects.toThrow('Product not found')
  })
})
