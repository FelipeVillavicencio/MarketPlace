import { Transaction } from '../../src/domain/Transaction'

describe('Transaction', () => {
  const validItem = { productId: 'p1', name: 'Laptop', price: 500, quantity: 2 }
  const validData = {
    orderNumber: 'ORD-001',
    customer: { name: 'Felipe', email: 'felipe@example.com' },
    items: [validItem],
  }

  it('creates a transaction and calculates total', () => {
    const tx = new Transaction(validData)
    expect(tx.orderNumber).toBe('ORD-001')
    expect(tx.total).toBe(1000)
    expect(tx.status).toBe('pending')
  })

  it('calculates total with multiple items', () => {
    const tx = new Transaction({
      ...validData,
      items: [
        { productId: 'p1', name: 'Laptop', price: 500, quantity: 1 },
        { productId: 'p2', name: 'Mouse', price: 25, quantity: 3 },
      ],
    })
    expect(tx.total).toBe(575)
  })

  it('throws when items is empty', () => {
    expect(() => new Transaction({ ...validData, items: [] })).toThrow(
      'La transacción debe tener al menos un item'
    )
  })

  it('throws when customer email is invalid', () => {
    expect(() =>
      new Transaction({ ...validData, customer: { name: 'Felipe', email: 'bademail' } })
    ).toThrow('Email de cliente inválido')
  })

  it('accepts explicit status', () => {
    const tx = new Transaction({ ...validData, status: 'paid' })
    expect(tx.status).toBe('paid')
  })

  it('accepts optional _id and createdAt', () => {
    const now = new Date()
    const tx = new Transaction({ ...validData, _id: 'tx123', createdAt: now })
    expect(tx._id).toBe('tx123')
    expect(tx.createdAt).toBe(now)
  })
})
