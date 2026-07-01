import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

let mongod: MongoMemoryServer | null = null
let refCount = 0

export async function connectTestDB(): Promise<void> {
  refCount++
  if (mongoose.connection.readyState === 1) {
    // Already connected — reuse connection
    return
  }
  mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()
  await mongoose.connect(uri)
}

export async function disconnectTestDB(): Promise<void> {
  refCount--
  if (refCount > 0) return
  await mongoose.disconnect()
  if (mongod) {
    await mongod.stop()
    mongod = null
  }
}

export async function clearTestDB(): Promise<void> {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
}
