import { auth } from '@/auth'
import { apiFetch } from '@/lib/api'

async function getStats(token: string) {
  const [products, users, transactions] = await Promise.all([
    apiFetch<{ total: number }>('/api/products?limit=1', { token }),
    apiFetch<{ total: number }>('/api/users?limit=1', { token }),
    apiFetch<{ total: number }>('/api/transactions?limit=1', { token }),
  ])
  return { products: products.total, users: users.total, transactions: transactions.total }
}

export default async function DashboardPage() {
  const session = await auth()
  const stats = await getStats(session!.user.accessToken)

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Productos', value: stats.products },
          { label: 'Usuarios', value: stats.users },
          { label: 'Transacciones', value: stats.transactions },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
