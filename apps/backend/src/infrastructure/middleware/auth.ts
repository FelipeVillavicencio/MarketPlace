import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/AuthService'
import { MongoUserRepository } from '../repositories/MongoUserRepository'

export interface AuthRequest extends Request {
  user?: { id: string; role: string }
}

function getAuthService(): AuthService {
  const userRepo = new MongoUserRepository()
  return new AuthService(userRepo)
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token requerido' })
    return
  }
  const token = header.slice(7)
  getAuthService()
    .verifyToken(token)
    .then((payload) => {
      req.user = payload
      next()
    })
    .catch(() => {
      res.status(401).json({ message: 'Token inválido' })
    })
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Acceso denegado' })
    return
  }
  next()
}
