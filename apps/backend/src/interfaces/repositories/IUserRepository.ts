import { User } from '../../domain/User'

export interface UserFilters {
  page?: number
  limit?: number
}

export interface IUserRepository {
  create(user: User): Promise<User>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findAll(filters: UserFilters): Promise<{ data: User[]; total: number }>
  update(id: string, data: Partial<Omit<User, '_id' | 'createdAt' | 'updatedAt'>>): Promise<User | null>
  delete(id: string): Promise<boolean>
}
