import { IProductRepository } from '../../../interfaces/repositories/IProductRepository'
import { Product } from '../../../domain/Product'

export class GetProductBySlugUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(slug: string): Promise<Product> {
    const product = await this.productRepo.findBySlug(slug)
    if (!product || !product.active) throw new Error('Producto no encontrado')
    return product
  }
}
