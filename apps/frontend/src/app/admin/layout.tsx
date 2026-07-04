import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { AdminNav } from '@/components/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 p-8 bg-gray-50">{children}</main>
    </div>
  )
}
