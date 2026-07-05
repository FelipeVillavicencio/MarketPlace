'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createProductSchema, CreateProductInput } from '@marketplace/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/api'

// zodResolver types form values by the schema's *input* shape (fields with
// `.default()` — attributes/images/active — are optional pre-validation).
// `CreateProductInput` (z.infer) is the *output* shape used once submitted.
type ProductFormValues = z.input<typeof createProductSchema>

interface Props {
  token: string
  defaultValues?: Partial<CreateProductInput>
  productId?: string
}

export function ProductForm({ token, defaultValues, productId }: Props) {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<ProductFormValues, unknown, CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues,
  })

  async function onSubmit(data: CreateProductInput) {
    try {
      if (productId) {
        await apiFetch(`/api/products/${productId}`, { method: 'PUT', body: JSON.stringify(data), token })
      } else {
        await apiFetch('/api/products', { method: 'POST', body: JSON.stringify(data), token })
      }
      router.push('/admin/products')
      router.refresh()
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'Error al guardar el producto' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      {[
        { name: 'name', label: 'Nombre', type: 'text' },
        { name: 'description', label: 'Descripción', type: 'text' },
        { name: 'price', label: 'Precio', type: 'number' },
        { name: 'stock', label: 'Stock', type: 'number' },
        { name: 'category', label: 'Categoría', type: 'text' },
      ].map(({ name, label, type }) => (
        <div key={name}>
          <Label htmlFor={name}>{label}</Label>
          <Input
            id={name}
            type={type}
            {...register(name as keyof ProductFormValues, { valueAsNumber: type === 'number' })}
          />
          {errors[name as keyof ProductFormValues] && (
            <p className="text-sm text-red-500">{String(errors[name as keyof ProductFormValues]?.message ?? '')}</p>
          )}
        </div>
      ))}
      {errors.root && <p className="text-sm text-red-500">{errors.root.message}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : productId ? 'Actualizar' : 'Crear producto'}
      </Button>
    </form>
  )
}
