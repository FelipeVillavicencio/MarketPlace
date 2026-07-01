import { IProductRepository, ProductFilters, PaginatedResult } from '../../interfaces/repositories/IProductRepository'
import { Product } from '../../domain/Product'
import { ProductModel } from '../models/ProductModel'

function toProduct(doc: any): Product {
  return new Product({
    _id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    price: doc.price,
    stock: doc.stock,
    category: doc.category,
    attributes: doc.attributes instanceof Map ? Object.fromEntries(doc.attributes) : doc.attributes ?? {},
    images: doc.images,
    active: doc.active,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  })
}

export class MongoProductRepository implements IProductRepository {
  async create(product: Product): Promise<Product> {
    const doc = await ProductModel.create(product)
    return toProduct(doc)
  }

  async findById(id: string): Promise<Product | null> {
    const doc = await ProductModel.findById(id).lean()
    return doc ? toProduct(doc) : null
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const doc = await ProductModel.findOne({ slug }).lean()
    return doc ? toProduct(doc) : null
  }

  async findAll(filters: ProductFilters): Promise<PaginatedResult<Product>> {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    const query: Record<string, unknown> = {}

    if (filters.active !== undefined) query.active = filters.active
    if (filters.category) query.category = filters.category
    if (filters.search) query.name = { $regex: filters.search, $options: 'i' }

    const [docs, total] = await Promise.all([
      ProductModel.find(query).skip((page - 1) * limit).limit(limit).lean(),
      ProductModel.countDocuments(query),
    ])

    return { data: docs.map(toProduct), total, page, pages: Math.ceil(total / limit) }
  }

  async update(id: string, data: Partial<Omit<Product, '_id' | 'createdAt' | 'updatedAt'>>): Promise<Product | null> {
    const doc = await ProductModel.findByIdAndUpdate(id, data, { new: true }).lean()
    return doc ? toProduct(doc) : null
  }

  async softDelete(id: string): Promise<Product | null> {
    const doc = await ProductModel.findByIdAndUpdate(id, { active: false }, { new: true }).lean()
    return doc ? toProduct(doc) : null
  }
}
