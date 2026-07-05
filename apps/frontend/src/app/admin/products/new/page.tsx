import { auth } from '@/auth'
import { ProductForm } from '@/components/products/ProductForm'

export default async function NewProductPage() {
  const session = await auth()
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Nuevo producto</h2>
      <ProductForm token={session!.user.accessToken} />
    </div>
  )
}
