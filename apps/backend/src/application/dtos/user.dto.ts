export interface CreateUserDTO {
  name: string
  email: string
  password: string
  role?: 'admin' | 'customer'
}

export interface UpdateUserDTO {
  name?: string
  email?: string
}
