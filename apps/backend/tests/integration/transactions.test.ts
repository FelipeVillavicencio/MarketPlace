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
  await createUser.execute({ name: 'Admin', email: 'admin@test.com', password: 'pass123', role: 'admin' })
  const result = await authService.login('admin@test.com', 'pass123')
  return result.token
}

async function getCustomerToken(): Promise<string> {
  const userRepo = new MongoUserRepository()
  const authService = new AuthService(userRepo)
  const createUser = new CreateUserUseCase(userRepo, authService)
  await createUser.execute({ name: 'Customer', email: 'customer@test.com', password: 'pass123', role: 'customer' })
  const result = await authService.login('customer@test.com', 'pass123')
  return result.token
}

const sampleTransactionBody = {
  customer: { name: 'Juan', email: 'juan@test.com' },
  items: [{ productId: '000000000000000000000001', name: 'Widget', price: 10, quantity: 2 }],
}

describe('POST /api/transactions', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).post('/api/transactions').send(sampleTransactionBody)
    expect(res.status).toBe(401)
  })

  test('customer can create a transaction', async () => {
    const token = await getCustomerToken()
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleTransactionBody)
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('orderNumber')
    expect(res.body.total).toBe(20)
    expect(res.body.status).toBe('pending')
  })

  test('admin can create a transaction', async () => {
    const token = await getAdminToken()
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleTransactionBody)
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('_id')
  })
})

describe('GET /api/transactions', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/transactions')
    expect(res.status).toBe(401)
  })

  test('returns 403 for customer', async () => {
    const token = await getCustomerToken()
    const res = await request(app).get('/api/transactions').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  test('admin can list transactions', async () => {
    const token = await getAdminToken()
    const res = await request(app).get('/api/transactions').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('data')
  })
})

describe('PATCH /api/transactions/:id/status', () => {
  test('admin can update transaction status', async () => {
    const token = await getAdminToken()
    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleTransactionBody)
    const id = createRes.body._id

    const res = await request(app)
      .patch(`/api/transactions/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'paid' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('paid')
  })
})
