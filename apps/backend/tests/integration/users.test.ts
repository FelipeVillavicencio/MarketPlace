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

describe('GET /api/users', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/users')
    expect(res.status).toBe(401)
  })

  test('returns 403 with customer token', async () => {
    const token = await getCustomerToken()
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  test('returns users list for admin', async () => {
    const token = await getAdminToken()
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('data')
    expect(res.body).toHaveProperty('total')
  })
})

describe('GET /api/users/:id', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/users/some-id')
    expect(res.status).toBe(401)
  })

  test('returns user by id for admin', async () => {
    const token = await getAdminToken()
    const listRes = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`)
    const userId = listRes.body.data[0]._id
    const res = await request(app).get(`/api/users/${userId}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body._id).toBe(userId)
    expect(res.body).not.toHaveProperty('passwordHash')
  })

  test('returns 500 for non-existent user id', async () => {
    const token = await getAdminToken()
    const res = await request(app).get('/api/users/000000000000000000000000').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(500)
  })
})
