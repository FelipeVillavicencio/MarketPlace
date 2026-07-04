import { IProductRepository } from '../../../interfaces/repositories/IProductRepository'
import type { Product } from '../../../domain/Product'
import { UpdateProductDTO } from '../../dtos/product.dto'
import { NotFoundError } from '../../../domain/errors'

export class UpdateProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string, dto: UpdateProductDTO): Promise<Product> {
    // Slug regeneration from `name` is handled by the repository (single source of truth).
    const product = await this.productRepo.update(id, dto)
    if (!product) throw new NotFoundError('Producto no encontrado')
    return product
  }
}
