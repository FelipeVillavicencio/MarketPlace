import mongoose, { Schema, Document } from 'mongoose'

export interface ProductDocument extends Document {
  name: string
  slug: string
  description: string
  price: number
  stock: number
  category: string
  attributes: Map<string, string>
  images: string[]
  active: boolean
}

const productSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    category: { type: String, required: true },
    attributes: { type: Map, of: String, default: {} },
    images: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const ProductModel = mongoose.model<ProductDocument>('Product', productSchema)
