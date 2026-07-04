import { Response, NextFunction } from 'express'
import { AuthService } from '../services/AuthService'
import { MongoUserRepository } from '../repositories/MongoUserRepository'
import { CreateUserUseCase } from '../../application/use-cases/users/CreateUser'
import { GetUserByIdUseCase } from '../../application/use-cases/users/GetUserById'
import { AuthRequest } from '../middlewares/auth'
import { toSafeUser } from '../../domain/User'

const userRepo = new MongoUserRepository()
const authService = new AuthService(userRepo)
const createUser = new CreateUserUseCase(userRepo, authService)
const getUserById = new GetUserByIdUseCase(userRepo)

export class AuthController {
  register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email, password, role } = req.body as {
        name: string
        email: string
        password: string
        role?: 'admin' | 'customer'
      }
      const user = await createUser.execute({ name, email, password, role })
      res.status(201).json(toSafeUser(user))
    } catch (err) {
      next(err)
    }
  }

  login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body as { email: string; password: string }
      const result = await authService.login(email, password)
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  me = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await getUserById.execute(req.userId!)
      res.json(toSafeUser(user))
    } catch (err) {
      next(err)
    }
  }
}
