import { IProductRepository } from '../../../interfaces/repositories/IProductRepository'
import { GetProductsDTO } from '../../dtos/product.dto'

export class GetProductsUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(dto: GetProductsDTO = {}) {
    return this.productRepo.findAll({
      active: dto.includeInactive ? undefined : true,
      category: dto.category,
      search: dto.search,
      page: dto.page,
      limit: dto.limit,
    })
  }
}
