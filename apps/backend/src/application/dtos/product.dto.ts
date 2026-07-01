export interface CreateProductDTO {
  name: string
  description: string
  price: number
  stock: number
  category: string
  attributes?: Record<string, string>
  images?: string[]
}

export interface UpdateProductDTO {
  name?: string
  description?: string
  price?: number
  stock?: number
  category?: string
  attributes?: Record<string, string>
  images?: string[]
  active?: boolean
}

export interface GetProductsDTO {
  category?: string
  search?: string
  page?: number
  limit?: number
  includeInactive?: boolean
}
