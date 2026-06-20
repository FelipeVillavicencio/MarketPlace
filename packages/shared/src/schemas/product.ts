import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  description: z.string().min(10, 'Descripción requerida'),
  price: z.number().positive('Precio debe ser positivo'),
  stock: z.number().int().min(0, 'Stock no puede ser negativo'),
  category: z.string().min(1, 'Categoría requerida'),
  attributes: z.record(z.string()).default({}),
  images: z.array(z.string()).default([]),
  active: z.boolean().default(true),
})

export const updateProductSchema = createProductSchema.partial()

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
