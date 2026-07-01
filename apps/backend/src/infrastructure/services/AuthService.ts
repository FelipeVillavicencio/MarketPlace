import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { IAuthService, AuthPayload } from '../../interfaces/services/IAuthService'
import { IUserRepository } from '../../interfaces/repositories/IUserRepository'
import { AuthError } from '../../domain/errors'

const JWT_SECRET = process.env.JWT_SECRET || 'changeme'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

interface JwtPayload {
  id: string
  role: string
}

export class AuthService implements IAuthService {
  constructor(private userRepo: IUserRepository) {}

  async login(email: string, password: string): Promise<AuthPayload> {
    const user = await this.userRepo.findByEmail(email)
    if (!user) throw new AuthError('Invalid credentials')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new AuthError('Invalid credentials')

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions)

    const { passwordHash: _pw, ...userWithoutPassword } = user
    return { token, user: userWithoutPassword }
  }

  async verifyToken(token: string): Promise<{ id: string; role: string }> {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    return { id: decoded.id, role: decoded.role }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }
}
