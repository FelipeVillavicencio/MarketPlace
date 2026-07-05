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
  await createUser.execute({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
  })
  const result = await authService.login('admin@test.com', 'password123')
  return result.token
}

describe('GET /health', () => {
  test('returns ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})

describe('GET /api/products', () => {
  test('returns empty paginated list when no products', async () => {
    const res = await request(app).get('/api/products')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toEqual([])
    expect(res.body).toHaveProperty('total')
  })
})

describe('POST /api/products', () => {
  test('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/products').send({
      name: 'Test Product',
      description: 'A product',
      price: 100,
      stock: 10,
      category: 'electronics',
    })
    expect(res.status).toBe(401)
  })

  test('creates a product with valid token', async () => {
    const token = await getAdminToken()
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Product',
        description: 'A product',
        price: 100,
        stock: 10,
        category: 'electronics',
      })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Test Product')
    expect(res.body.slug).toBe('test-product')
  })
})

describe('GET /api/products/:slug', () => {
  test('returns 404 for non-existent slug', async () => {
    const res = await request(app).get('/api/products/nonexistent-slug')
    expect(res.status).toBe(404)
  })

  test('returns product by slug', async () => {
    const token = await getAdminToken()
    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Slug Product',
        description: 'A product',
        price: 50,
        stock: 5,
        category: 'books',
      })
    const res = await request(app).get('/api/products/slug-product')
    expect(res.status).toBe(200)
    expect(res.body.slug).toBe('slug-product')
  })
})

describe('GET /api/products/:id (admin lookup by Mongo id)', () => {
  test('returns an inactive product by id, unlike the slug path', async () => {
    const token = await getAdminToken()
    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Discontinued Item',
        description: 'A product',
        price: 25,
        stock: 0,
        category: 'misc',
      })
    const id = createRes.body._id

    await request(app).delete(`/api/products/${id}`).set('Authorization', `Bearer ${token}`)

    const bySlug = await request(app).get('/api/products/discontinued-item')
    expect(bySlug.status).toBe(404)

    const byId = await request(app).get(`/api/products/${id}`)
    expect(byId.status).toBe(200)
    expect(byId.body._id).toBe(id)
    expect(byId.body.active).toBe(false)
  })

  test('returns 404 for a well-formed id that does not exist', async () => {
    const res = await request(app).get('/api/products/000000000000000000000000')
    expect(res.status).toBe(404)
  })
})

describe('POST /api/auth/register', () => {
  test('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'New User',
      email: 'newuser@test.com',
      password: 'password123',
    })
    expect(res.status).toBe(201)
    expect(res.body.email).toBe('newuser@test.com')
    expect(res.body).not.toHaveProperty('passwordHash')
  })
})

describe('POST /api/auth/login', () => {
  test('returns token on valid credentials', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login User',
      email: 'login@test.com',
      password: 'password123',
    })
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@test.com',
      password: 'password123',
    })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body).toHaveProperty('user')
  })

  test('returns 401 on invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nonexistent@test.com',
      password: 'wrongpassword',
    })
    expect(res.status).toBe(401)
  })
})
