import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/AuthService'
import { MongoUserRepository } from '../repositories/MongoUserRepository'

const userRepo = new MongoUserRepository()
const authService = new AuthService(userRepo)

export interface AuthRequest extends Request {
  userId?: string
  userRole?: string
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No autorizado' })
    return
  }
  const token = authHeader.split(' ')[1]
  try {
    const payload = await authService.verifyToken(token)
    req.userId = payload.id
    req.userRole = payload.role
    next()
  } catch {
    res.status(401).json({ message: 'Token inválido' })
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.userRole !== 'admin') {
    res.status(403).json({ message: 'Acceso denegado' })
    return
  }
  next()
}
