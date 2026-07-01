import mongoose from 'mongoose'
import { connectTestDB, disconnectTestDB, clearTestDB } from './testSetup'
import { MongoUserRepository } from '../../src/infrastructure/repositories/MongoUserRepository'
import { User } from '../../src/domain/User'

beforeAll(async () => {
  await connectTestDB()
}, 30000)

afterAll(async () => {
  await disconnectTestDB()
}, 30000)

afterEach(async () => {
  await clearTestDB()
})

function makeUser(overrides: Partial<ConstructorParameters<typeof User>[0]> = {}): User {
  return new User({
    name: 'Jane Doe',
    email: 'jane@example.com',
    passwordHash: 'hashedpassword',
    ...overrides,
  })
}

describe('MongoUserRepository', () => {
  let repo: MongoUserRepository

  beforeEach(() => {
    repo = new MongoUserRepository()
  })

  test('creates a user and returns it with an _id', async () => {
    const user = makeUser()
    const saved = await repo.create(user)

    expect(saved._id).toBeDefined()
    expect(saved.name).toBe('Jane Doe')
    expect(saved.email).toBe('jane@example.com')
    expect(saved.role).toBe('customer')
  })

  test('findById returns the user by id', async () => {
    const saved = await repo.create(makeUser())
    const found = await repo.findById(saved._id!)

    expect(found).not.toBeNull()
    expect(found!._id).toBe(saved._id)
    expect(found!.email).toBe('jane@example.com')
  })

  test('findById returns null for non-existent id', async () => {
    const result = await repo.findById(new mongoose.Types.ObjectId().toString())
    expect(result).toBeNull()
  })

  test('findByEmail returns the user by email', async () => {
    await repo.create(makeUser({ email: 'lookup@example.com' }))
    const found = await repo.findByEmail('lookup@example.com')

    expect(found).not.toBeNull()
    expect(found!.email).toBe('lookup@example.com')
  })

  test('findByEmail returns null for unknown email', async () => {
    const result = await repo.findByEmail('ghost@example.com')
    expect(result).toBeNull()
  })

  test('findAll returns users with pagination', async () => {
    await repo.create(makeUser({ email: 'a@example.com' }))
    await repo.create(makeUser({ email: 'b@example.com' }))

    const result = await repo.findAll({ page: 1, limit: 10 })
    expect(result.total).toBe(2)
    expect(result.data.length).toBe(2)
  })

  test('update changes fields and returns the updated user', async () => {
    const saved = await repo.create(makeUser())
    const updated = await repo.update(saved._id!, { name: 'Updated Name' })

    expect(updated).not.toBeNull()
    expect(updated!.name).toBe('Updated Name')
  })

  test('update returns null for non-existent id', async () => {
    const result = await repo.update(new mongoose.Types.ObjectId().toString(), { name: 'X' })
    expect(result).toBeNull()
  })

  test('delete removes the user and returns true', async () => {
    const saved = await repo.create(makeUser())
    const result = await repo.delete(saved._id!)

    expect(result).toBe(true)
    const found = await repo.findById(saved._id!)
    expect(found).toBeNull()
  })

  test('delete returns false for non-existent id', async () => {
    const result = await repo.delete(new mongoose.Types.ObjectId().toString())
    expect(result).toBe(false)
  })
})
