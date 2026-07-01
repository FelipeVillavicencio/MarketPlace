import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({ errors: err.errors })
    return
  }
  if (err instanceof Error) {
    res.status(500).json({ message: err.message })
    return
  }
  res.status(500).json({ message: 'Error interno del servidor' })
}
