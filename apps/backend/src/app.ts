import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { errorHandler } from './infrastructure/middlewares/errorHandler'
import authRouter from './infrastructure/routes/auth'
import productsRouter from './infrastructure/routes/products'
import usersRouter from './infrastructure/routes/users'
import transactionsRouter from './infrastructure/routes/transactions'

export function createApp() {
  const app = express()
  app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }))
  app.use(express.json())
  app.use(morgan('dev'))

  app.get('/health', (_req, res) => { res.json({ status: 'ok' }) })
  app.use('/api/auth', authRouter)
  app.use('/api/products', productsRouter)
  app.use('/api/users', usersRouter)
  app.use('/api/transactions', transactionsRouter)

  app.use(errorHandler)
  return app
}
