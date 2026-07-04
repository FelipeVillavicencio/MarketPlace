export type UserRole = 'admin' | 'customer'

export class User {
  readonly _id?: string
  readonly name: string
  readonly email: string
  readonly passwordHash: string
  readonly role: UserRole
  readonly createdAt?: Date
  readonly updatedAt?: Date

  constructor(data: {
    _id?: string
    name: string
    email: string
    passwordHash: string
    role?: UserRole
    createdAt?: Date
    updatedAt?: Date
  }) {
    if (data.name.trim().length < 2) throw new Error('El nombre es requerido')
    if (!data.email.includes('@')) throw new Error('Email inválido')

    this._id = data._id
    this.name = data.name.trim()
    this.email = data.email.toLowerCase()
    this.passwordHash = data.passwordHash
    this.role = data.role ?? 'customer'
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}

export function toSafeUser(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash: _pw, ...safeUser } = user
  return safeUser
}
