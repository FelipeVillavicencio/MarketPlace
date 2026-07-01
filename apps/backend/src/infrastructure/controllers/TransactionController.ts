import { Request, Response, NextFunction } from 'express'
import { MongoTransactionRepository } from '../repositories/MongoTransactionRepository'
import { CreateTransactionUseCase } from '../../application/use-cases/transactions/CreateTransaction'
import { GetTransactionsUseCase } from '../../application/use-cases/transactions/GetTransactions'
import { GetTransactionByIdUseCase } from '../../application/use-cases/transactions/GetTransactionById'
import { UpdateTransactionStatusUseCase } from '../../application/use-cases/transactions/UpdateTransactionStatus'
import { TransactionStatus } from '../../domain/Transaction'

export class TransactionController {
  private repo() {
    return new MongoTransactionRepository()
  }

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, page, limit } = req.query as Record<string, string | undefined>
      const useCase = new GetTransactionsUseCase(this.repo())
      const result = await useCase.execute({
        status: status as TransactionStatus | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      })
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const useCase = new GetTransactionByIdUseCase(this.repo())
      const transaction = await useCase.execute(req.params.id)
      res.json(transaction)
    } catch (err) {
      next(err)
    }
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const useCase = new CreateTransactionUseCase(this.repo())
      const transaction = await useCase.execute(req.body)
      res.status(201).json(transaction)
    } catch (err) {
      next(err)
    }
  }

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.body as { status: TransactionStatus }
      const useCase = new UpdateTransactionStatusUseCase(this.repo())
      const transaction = await useCase.execute(req.params.id, status)
      res.json(transaction)
    } catch (err) {
      next(err)
    }
  }
}
