import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { NotFoundError, AuthError, ValidationError } from '../../domain/errors'

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
  if (err instanceof ValidationError) {
    res.status(400).json({ message: err.message })
    return
  }
  if (err instanceof AuthError) {
    res.status(401).json({ message: err.message })
    return
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ message: err.message })
    return
  }
  if (err instanceof Error) {
    res.status(500).json({ message: err.message })
    return
  }
  res.status(500).json({ message: 'Error interno del servidor' })
}
