import { auth } from '@/auth'
import { apiFetch } from '@/lib/api'
import { IProduct } from '@marketplace/shared'
import { ProductForm } from '@/components/products/ProductForm'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const product = await apiFetch<IProduct>(`/api/products/${id}`, {
    token: session!.user.accessToken,
  }).catch(() => null)

  if (!product) return <p>Producto no encontrado</p>

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Editar producto</h2>
      <ProductForm token={session!.user.accessToken} defaultValues={product} productId={id} />
    </div>
  )
}
