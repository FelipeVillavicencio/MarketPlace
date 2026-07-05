import { auth } from '@/auth'
import { apiFetch } from '@/lib/api'
import { IProduct } from '@marketplace/shared'
import { ProductTable } from '@/components/products/ProductTable'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function ProductsPage() {
  const session = await auth()
  const { data } = await apiFetch<{ data: IProduct[] }>('/api/products?limit=100', {
    token: session!.user.accessToken,
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Productos</h2>
        <Button render={<Link href="/admin/products/new">Nuevo producto</Link>} />
      </div>
      <ProductTable products={data} token={session!.user.accessToken} />
    </div>
  )
}
