import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['admin', 'customer']).default('customer'),
})

export const updateUserSchema = createUserSchema.partial().omit({ password: true })

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type LoginInput = z.infer<typeof loginSchema>
