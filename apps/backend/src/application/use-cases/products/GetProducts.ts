import { IProductRepository, PaginatedResult } from '../../../interfaces/repositories/IProductRepository'
import type { Product } from '../../../domain/Product'
import { GetProductsDTO } from '../../dtos/product.dto'

export class GetProductsUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(dto: GetProductsDTO = {}): Promise<PaginatedResult<Product>> {
    return this.productRepo.findAll({
      active: dto.includeInactive ? undefined : true,
      category: dto.category,
      search: dto.search,
      page: dto.page,
      limit: dto.limit,
    })
  }
}
