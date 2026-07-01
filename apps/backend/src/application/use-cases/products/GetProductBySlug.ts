import { IProductRepository } from '../../../interfaces/repositories/IProductRepository'
import { Product } from '../../../domain/Product'
import { NotFoundError } from '../../../domain/errors'

export class GetProductBySlugUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(slug: string): Promise<Product> {
    const product = await this.productRepo.findBySlug(slug)
    if (!product || !product.active) throw new NotFoundError('Product not found')
    return product
  }
}
