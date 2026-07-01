import { Product } from '../../domain/Product'

export interface ProductFilters {
  active?: boolean
  category?: string
  search?: string
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pages: number
}

export interface IProductRepository {
  create(product: Product): Promise<Product>
  findById(id: string): Promise<Product | null>
  findBySlug(slug: string): Promise<Product | null>
  findAll(filters: ProductFilters): Promise<PaginatedResult<Product>>
  update(id: string, data: Partial<Omit<Product, '_id' | 'createdAt' | 'updatedAt'>>): Promise<Product | null>
  softDelete(id: string): Promise<Product | null>
}
