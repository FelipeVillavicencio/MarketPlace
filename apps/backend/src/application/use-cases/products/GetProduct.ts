import { IProductRepository } from '../../../interfaces/repositories/IProductRepository'
import { Product } from '../../../domain/Product'
import { NotFoundError } from '../../../domain/errors'

const MONGO_ID_REGEX = /^[0-9a-fA-F]{24}$/

export class GetProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(identifier: string): Promise<Product> {
    const isId = MONGO_ID_REGEX.test(identifier)
    const product = isId
      ? await this.productRepo.findById(identifier)
      : await this.productRepo.findBySlug(identifier)

    // Slug lookups are the public storefront path and only ever surface
    // published products. Id lookups are the admin path and need inactive
    // (soft-deleted) products too, so an admin can re-activate them.
    if (!product || (!isId && !product.active)) {
      throw new NotFoundError('Product not found')
    }
    return product
  }
}
