import { Request, Response, NextFunction } from 'express'
import { MongoProductRepository } from '../repositories/MongoProductRepository'
import { CreateProductUseCase } from '../../application/use-cases/products/CreateProduct'
import { GetProductsUseCase } from '../../application/use-cases/products/GetProducts'
import { GetProductUseCase } from '../../application/use-cases/products/GetProduct'
import { UpdateProductUseCase } from '../../application/use-cases/products/UpdateProduct'
import { DeleteProductUseCase } from '../../application/use-cases/products/DeleteProduct'

export class ProductController {
  private repo() {
    return new MongoProductRepository()
  }

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category, search, page, limit, includeInactive } = req.query as Record<string, string | undefined>
      const useCase = new GetProductsUseCase(this.repo())
      const result = await useCase.execute({
        category,
        search,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        includeInactive: includeInactive === 'true',
      })
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const useCase = new GetProductUseCase(this.repo())
      const product = await useCase.execute(req.params.identifier)
      res.json(product)
    } catch (err) {
      next(err)
    }
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const useCase = new CreateProductUseCase(this.repo())
      const product = await useCase.execute(req.body)
      res.status(201).json(product)
    } catch (err) {
      next(err)
    }
  }

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const useCase = new UpdateProductUseCase(this.repo())
      const product = await useCase.execute(req.params.id, req.body)
      res.json(product)
    } catch (err) {
      next(err)
    }
  }

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const useCase = new DeleteProductUseCase(this.repo())
      await useCase.execute(req.params.id)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }
}
