import { Request, Response, NextFunction } from 'express'
import { MongoUserRepository } from '../repositories/MongoUserRepository'
import { MongoProductRepository } from '../repositories/MongoProductRepository'
import { AuthService } from '../services/AuthService'
import { CreateUserUseCase } from '../../application/use-cases/users/CreateUser'
import { GetUsersUseCase } from '../../application/use-cases/users/GetUsers'
import { GetUserByIdUseCase } from '../../application/use-cases/users/GetUserById'
import { UpdateUserUseCase } from '../../application/use-cases/users/UpdateUser'
import { DeleteUserUseCase } from '../../application/use-cases/users/DeleteUser'

export class UserController {
  private repo() {
    return new MongoUserRepository()
  }

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = req.query as Record<string, string | undefined>
      const useCase = new GetUsersUseCase(this.repo())
      const result = await useCase.execute(page ? Number(page) : undefined, limit ? Number(limit) : undefined)
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const useCase = new GetUserByIdUseCase(this.repo())
      const user = await useCase.execute(req.params.id)
      const { passwordHash: _pw, ...userWithoutPassword } = user
      res.json(userWithoutPassword)
    } catch (err) {
      next(err)
    }
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRepo = this.repo()
      const authService = new AuthService(userRepo)
      const useCase = new CreateUserUseCase(userRepo, authService)
      const user = await useCase.execute(req.body)
      const { passwordHash: _pw, ...userWithoutPassword } = user
      res.status(201).json(userWithoutPassword)
    } catch (err) {
      next(err)
    }
  }

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const useCase = new UpdateUserUseCase(this.repo())
      const user = await useCase.execute(req.params.id, req.body)
      const { passwordHash: _pw, ...userWithoutPassword } = user
      res.json(userWithoutPassword)
    } catch (err) {
      next(err)
    }
  }

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const useCase = new DeleteUserUseCase(this.repo())
      await useCase.execute(req.params.id)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }
}
