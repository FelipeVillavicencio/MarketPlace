import slugify from 'slugify'
import { IProductRepository } from '../../../interfaces/repositories/IProductRepository'
import type { Product } from '../../../domain/Product'
import { UpdateProductDTO } from '../../dtos/product.dto'
import { NotFoundError } from '../../../domain/errors'

export class UpdateProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string, dto: UpdateProductDTO): Promise<Product> {
    const update: UpdateProductDTO & { slug?: string } = { ...dto }
    if (dto.name) update.slug = slugify(dto.name, { lower: true, strict: true })
    const product = await this.productRepo.update(id, update)
    if (!product) throw new NotFoundError('Producto no encontrado')
    return product
  }
}
