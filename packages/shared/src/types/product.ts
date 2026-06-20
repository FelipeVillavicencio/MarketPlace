export interface IProduct {
  _id: string
  name: string
  slug: string
  description: string
  price: number
  stock: number
  category: string
  attributes: Record<string, string>
  images: string[]
  active: boolean
  createdAt: string
  updatedAt: string
}
