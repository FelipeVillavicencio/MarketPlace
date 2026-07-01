export class Product {
  readonly _id?: string
  readonly name: string
  readonly slug: string
  readonly description: string
  readonly price: number
  readonly stock: number
  readonly category: string
  readonly attributes: Record<string, string>
  readonly images: string[]
  readonly active: boolean
  readonly createdAt?: Date
  readonly updatedAt?: Date

  constructor(data: {
    _id?: string
    name: string
    slug: string
    description: string
    price: number
    stock: number
    category: string
    attributes?: Record<string, string>
    images?: string[]
    active?: boolean
    createdAt?: Date
    updatedAt?: Date
  }) {
    if (data.price <= 0) throw new Error('El precio debe ser positivo')
    if (data.stock < 0) throw new Error('El stock no puede ser negativo')
    if (data.name.trim().length < 2) throw new Error('El nombre es requerido')

    this._id = data._id
    this.name = data.name.trim()
    this.slug = data.slug
    this.description = data.description
    this.price = data.price
    this.stock = data.stock
    this.category = data.category
    this.attributes = data.attributes ?? {}
    this.images = data.images ?? []
    this.active = data.active ?? true
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
