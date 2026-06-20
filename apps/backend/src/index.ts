import 'dotenv/config'
import { createApp } from './app'
import { connectDB } from './lib/db'

const PORT = process.env.PORT || 4000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace'

async function main() {
  await connectDB(MONGODB_URI)
  const app = createApp()
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`)
  })
}

main().catch(console.error)
