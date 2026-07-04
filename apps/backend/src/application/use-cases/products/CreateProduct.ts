import { IProductRepository } from '../../../interfaces/repositories/IProductRepository'
import { Product } from '../../../domain/Product'
import { CreateProductDTO } from '../../dtos/product.dto'
import { ValidationError } from '../../../domain/errors'
import { toSlug } from '../../shared/slug'

export class CreateProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(dto: CreateProductDTO): Promise<Product> {
    const slug = toSlug(dto.name)
    const existing = await this.productRepo.findBySlug(slug)
    if (existing) throw new ValidationError('Ya existe un producto con ese nombre')

    const product = new Product({ ...dto, slug })
    return this.productRepo.create(product)
  }
}
