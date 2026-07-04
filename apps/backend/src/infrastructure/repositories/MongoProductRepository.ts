import { Types } from 'mongoose'
import { IProductRepository, ProductFilters, PaginatedResult } from '../../interfaces/repositories/IProductRepository'
import { Product } from '../../domain/Product'
import { ProductModel } from '../models/ProductModel'
import { toSlug } from '../../application/shared/slug'
import { paginate } from './pagination'

interface ProductLean {
  _id: Types.ObjectId
  name: string
  slug: string
  description: string
  price: number
  stock: number
  category: string
  attributes: Map<string, string> | Record<string, string>
  images: string[]
  active: boolean
  createdAt?: Date
  updatedAt?: Date
}

function toProduct(doc: ProductLean): Product {
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
    return doc ? toProduct(doc as unknown as ProductLean) : null
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const doc = await ProductModel.findOne({ slug }).lean()
    return doc ? toProduct(doc as unknown as ProductLean) : null
  }

  async findAll(filters: ProductFilters): Promise<PaginatedResult<Product>> {
    const { page, limit, skip } = paginate(filters.page, filters.limit)
    const query: Record<string, unknown> = {}

    if (filters.active !== undefined) query.active = filters.active
    if (filters.category) query.category = filters.category
    if (filters.search) query.name = { $regex: filters.search, $options: 'i' }

    const [docs, total] = await Promise.all([
      ProductModel.find(query).skip(skip).limit(limit).lean(),
      ProductModel.countDocuments(query),
    ])

    return { data: (docs as unknown as ProductLean[]).map(toProduct), total, page, pages: Math.ceil(total / limit) }
  }

  async update(id: string, data: Partial<Omit<Product, '_id' | 'createdAt' | 'updatedAt'>>): Promise<Product | null> {
    const updateData: Partial<Omit<Product, '_id' | 'createdAt' | 'updatedAt'>> & { slug?: string } = { ...data }
    if (updateData.name) {
      updateData.slug = toSlug(updateData.name)
    }
    const doc = await ProductModel.findByIdAndUpdate(id, updateData, { new: true }).lean()
    return doc ? toProduct(doc as unknown as ProductLean) : null
  }

  async softDelete(id: string): Promise<Product | null> {
    const doc = await ProductModel.findByIdAndUpdate(id, { active: false }, { new: true }).lean()
    return doc ? toProduct(doc as unknown as ProductLean) : null
  }
}
