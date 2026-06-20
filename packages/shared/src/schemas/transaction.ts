import { z } from 'zod'

export const createTransactionSchema = z.object({
  customer: z.object({
    name: z.string().min(2, 'Nombre requerido'),
    email: z.string().email('Email inválido'),
  }),
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    price: z.number().positive(),
    quantity: z.number().int().positive(),
  })).min(1, 'Se requiere al menos un item'),
})

export const updateTransactionStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'cancelled']),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionStatusInput = z.infer<typeof updateTransactionStatusSchema>
