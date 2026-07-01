import { User } from '../../domain/User'

export interface AuthPayload {
  token: string
  user: Omit<User, 'passwordHash'>
}

export interface IAuthService {
  login(email: string, password: string): Promise<AuthPayload>
  verifyToken(token: string): Promise<{ id: string; role: string }>
  hashPassword(password: string): Promise<string>
}
