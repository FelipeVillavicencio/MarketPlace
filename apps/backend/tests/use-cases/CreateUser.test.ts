import { CreateUserUseCase } from '../../src/application/use-cases/users/CreateUser'
import { IUserRepository } from '../../src/interfaces/repositories/IUserRepository'
import { IAuthService, AuthPayload } from '../../src/interfaces/services/IAuthService'
import { User } from '../../src/domain/User'

const makeUserRepo = (overrides: Partial<IUserRepository> = {}): IUserRepository => ({
  create: jest.fn().mockImplementation(async (u: User) => u),
  findById: jest.fn().mockResolvedValue(null),
  findByEmail: jest.fn().mockResolvedValue(null),
  findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
  update: jest.fn().mockResolvedValue(null),
  delete: jest.fn().mockResolvedValue(true),
  ...overrides,
})

const makeAuthService = (): IAuthService => ({
  login: jest.fn().mockResolvedValue({} as AuthPayload),
  verifyToken: jest.fn().mockResolvedValue({ id: '1', role: 'admin' }),
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
})

describe('CreateUserUseCase', () => {
  it('hashes password and creates user', async () => {
    const repo = makeUserRepo()
    const auth = makeAuthService()
    const useCase = new CreateUserUseCase(repo, auth)

    const result = await useCase.execute({ name: 'Juan', email: 'juan@test.com', password: 'pass123' })

    expect(auth.hashPassword).toHaveBeenCalledWith('pass123')
    expect(repo.create).toHaveBeenCalledTimes(1)
    expect(result.email).toBe('juan@test.com')
  })

  it('throws if email already exists', async () => {
    const existing = new User({ name: 'Existing', email: 'juan@test.com', passwordHash: 'hash' })
    const repo = makeUserRepo({ findByEmail: jest.fn().mockResolvedValue(existing) })
    const useCase = new CreateUserUseCase(repo, makeAuthService())

    await expect(useCase.execute({ name: 'Juan', email: 'juan@test.com', password: 'pass' }))
      .rejects.toThrow('El email ya está registrado')
  })
})
