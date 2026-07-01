import { Product } from '../../src/domain/Product'

describe('Product', () => {
  const validData = {
    name: 'Laptop Pro',
    slug: 'laptop-pro',
    description: 'A great laptop',
    price: 999.99,
    stock: 10,
    category: 'electronics',
  }

  it('creates a product with valid data', () => {
    const product = new Product(validData)
    expect(product.name).toBe('Laptop Pro')
    expect(product.price).toBe(999.99)
    expect(product.stock).toBe(10)
    expect(product.active).toBe(true)
    expect(product.attributes).toEqual({})
    expect(product.images).toEqual([])
  })

  it('trims the name', () => {
    const product = new Product({ ...validData, name: '  Laptop  ' })
    expect(product.name).toBe('Laptop')
  })

  it('throws when price is zero', () => {
    expect(() => new Product({ ...validData, price: 0 })).toThrow('El precio debe ser positivo')
  })

  it('throws when price is negative', () => {
    expect(() => new Product({ ...validData, price: -1 })).toThrow('El precio debe ser positivo')
  })

  it('throws when stock is negative', () => {
    expect(() => new Product({ ...validData, stock: -1 })).toThrow('El stock no puede ser negativo')
  })

  it('throws when name is too short', () => {
    expect(() => new Product({ ...validData, name: 'A' })).toThrow('El nombre es requerido')
  })

  it('allows stock of zero', () => {
    const product = new Product({ ...validData, stock: 0 })
    expect(product.stock).toBe(0)
  })

  it('accepts optional _id and timestamps', () => {
    const now = new Date()
    const product = new Product({ ...validData, _id: 'abc123', createdAt: now })
    expect(product._id).toBe('abc123')
    expect(product.createdAt).toBe(now)
  })
})
