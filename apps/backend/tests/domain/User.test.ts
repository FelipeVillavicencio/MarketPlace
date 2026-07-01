import { User } from '../../src/domain/User'

describe('User', () => {
  const validData = {
    name: 'Felipe',
    email: 'felipe@example.com',
    passwordHash: 'hashed_password',
  }

  it('creates a user with valid data', () => {
    const user = new User(validData)
    expect(user.name).toBe('Felipe')
    expect(user.email).toBe('felipe@example.com')
    expect(user.role).toBe('customer')
  })

  it('lowercases the email', () => {
    const user = new User({ ...validData, email: 'FELIPE@EXAMPLE.COM' })
    expect(user.email).toBe('felipe@example.com')
  })

  it('trims the name', () => {
    const user = new User({ ...validData, name: '  Felipe  ' })
    expect(user.name).toBe('Felipe')
  })

  it('accepts admin role', () => {
    const user = new User({ ...validData, role: 'admin' })
    expect(user.role).toBe('admin')
  })

  it('throws when name is too short', () => {
    expect(() => new User({ ...validData, name: 'X' })).toThrow('El nombre es requerido')
  })

  it('throws when email is invalid', () => {
    expect(() => new User({ ...validData, email: 'notanemail' })).toThrow('Email inválido')
  })

  it('accepts optional _id and timestamps', () => {
    const now = new Date()
    const user = new User({ ...validData, _id: 'user123', createdAt: now })
    expect(user._id).toBe('user123')
    expect(user.createdAt).toBe(now)
  })
})
