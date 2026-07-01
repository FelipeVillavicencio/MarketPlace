import { IProductRepository } from '../../../interfaces/repositories/IProductRepository'

export class DeleteProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string): Promise<void> {
    const product = await this.productRepo.softDelete(id)
    if (!product) throw new Error('Producto no encontrado')
  }
}
