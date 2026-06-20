import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { errorHandler } from './middleware/errorHandler'

export function createApp() {
  const app = express()

  app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }))
  app.use(express.json())
  app.use(morgan('dev'))

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  // routes se agregan en tasks siguientes
  app.use(errorHandler)

  return app
}
