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
