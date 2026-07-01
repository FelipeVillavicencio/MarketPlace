import mongoose from 'mongoose'
import { connectTestDB, disconnectTestDB, clearTestDB } from './testSetup'
import { MongoTransactionRepository } from '../../src/infrastructure/repositories/MongoTransactionRepository'
import { Transaction } from '../../src/domain/Transaction'

beforeAll(async () => {
  await connectTestDB()
}, 30000)

afterAll(async () => {
  await disconnectTestDB()
}, 30000)

afterEach(async () => {
  await clearTestDB()
})

function makeTransaction(overrides: Partial<ConstructorParameters<typeof Transaction>[0]> = {}): Transaction {
  return new Transaction({
    orderNumber: `ORD-${Date.now()}`,
    customer: { name: 'John Doe', email: 'john@example.com' },
    items: [
      { productId: new mongoose.Types.ObjectId().toString(), name: 'Widget', price: 25.0, quantity: 2 },
    ],
    ...overrides,
  })
}

describe('MongoTransactionRepository', () => {
  let repo: MongoTransactionRepository

  beforeEach(() => {
    repo = new MongoTransactionRepository()
  })

  test('creates a transaction and returns it with an _id', async () => {
    const tx = makeTransaction()
    const saved = await repo.create(tx)

    expect(saved._id).toBeDefined()
    expect(saved.orderNumber).toBe(tx.orderNumber)
    expect(saved.status).toBe('pending')
    expect(saved.total).toBe(50)
    expect(saved.items.length).toBe(1)
  })

  test('findById returns the transaction by id', async () => {
    const saved = await repo.create(makeTransaction())
    const found = await repo.findById(saved._id!)

    expect(found).not.toBeNull()
    expect(found!._id).toBe(saved._id)
    expect(found!.customer.email).toBe('john@example.com')
  })

  test('findById returns null for non-existent id', async () => {
    const result = await repo.findById(new mongoose.Types.ObjectId().toString())
    expect(result).toBeNull()
  })

  test('findAll returns all transactions', async () => {
    await repo.create(makeTransaction({ orderNumber: 'ORD-001' }))
    await repo.create(makeTransaction({ orderNumber: 'ORD-002' }))

    const result = await repo.findAll({})
    expect(result.total).toBe(2)
    expect(result.data.length).toBe(2)
  })

  test('findAll filters by status', async () => {
    await repo.create(makeTransaction({ orderNumber: 'ORD-PENDING' }))
    const paid = await repo.create(makeTransaction({ orderNumber: 'ORD-PAID' }))
    await repo.updateStatus(paid._id!, 'paid')

    const result = await repo.findAll({ status: 'paid' })
    expect(result.total).toBe(1)
    expect(result.data[0].status).toBe('paid')
  })

  test('updateStatus changes the transaction status', async () => {
    const saved = await repo.create(makeTransaction())
    const updated = await repo.updateStatus(saved._id!, 'paid')

    expect(updated).not.toBeNull()
    expect(updated!.status).toBe('paid')
  })

  test('updateStatus returns null for non-existent id', async () => {
    const result = await repo.updateStatus(new mongoose.Types.ObjectId().toString(), 'cancelled')
    expect(result).toBeNull()
  })

  test('items preserve productId as string', async () => {
    const productId = new mongoose.Types.ObjectId().toString()
    const tx = makeTransaction({
      orderNumber: 'ORD-ID-TEST',
      items: [{ productId, name: 'Widget', price: 10, quantity: 1 }],
    })
    const saved = await repo.create(tx)

    expect(saved.items[0].productId).toBe(productId)
  })
})
