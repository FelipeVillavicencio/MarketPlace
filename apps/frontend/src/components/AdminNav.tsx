'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Productos' },
  { href: '/admin/users', label: 'Usuarios' },
  { href: '/admin/transactions', label: 'Transacciones' },
]

export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav className="w-56 min-h-screen bg-gray-900 text-white flex flex-col p-4">
      <h1 className="text-xl font-bold mb-8">Marketplace</h1>
      <ul className="space-y-2 flex-1">
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                'block px-3 py-2 rounded hover:bg-gray-700 text-sm',
                pathname === href && 'bg-gray-700'
              )}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="text-sm text-gray-400 hover:text-white mt-auto"
      >
        Cerrar sesión
      </button>
    </nav>
  )
}
