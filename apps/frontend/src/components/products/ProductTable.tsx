'use client'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IProduct } from '@marketplace/shared'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiFetch } from '@/lib/api'

interface Props {
  products: IProduct[]
  token: string
}

export function ProductTable({ products, token }: Props) {
  const router = useRouter()
  const qc = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/products/${id}`, { method: 'DELETE', token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      router.refresh()
    },
  })

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Precio</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p) => (
          <TableRow key={p._id}>
            <TableCell>{p.name}</TableCell>
            <TableCell>{p.category}</TableCell>
            <TableCell>${p.price}</TableCell>
            <TableCell>{p.stock}</TableCell>
            <TableCell>
              <Badge variant={p.active ? 'default' : 'secondary'}>
                {p.active ? 'Activo' : 'Inactivo'}
              </Badge>
            </TableCell>
            <TableCell className="space-x-2">
              <Button size="sm" variant="outline" onClick={() => router.push(`/admin/products/${p._id}`)}>
                Editar
              </Button>
              <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(p._id)}>
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
