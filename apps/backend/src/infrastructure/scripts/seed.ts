import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { MongoUserRepository } from '../repositories/MongoUserRepository'
import { MongoProductRepository } from '../repositories/MongoProductRepository'
import { AuthService } from '../services/AuthService'
import { CreateUserUseCase } from '../../application/use-cases/users/CreateUser'
import { CreateProductUseCase } from '../../application/use-cases/products/CreateProduct'

dotenv.config()

async function seed(): Promise<void> {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/marketplace'
  await mongoose.connect(MONGO_URI)
  console.log('Connected to MongoDB')

  const userRepo = new MongoUserRepository()
  const productRepo = new MongoProductRepository()
  const authService = new AuthService(userRepo)
  const createUser = new CreateUserUseCase(userRepo, authService)
  const createProduct = new CreateProductUseCase(productRepo)

  // Create admin user
  try {
    const admin = await createUser.execute({
      name: 'Admin User',
      email: 'admin@marketplace.com',
      password: 'Admin123!',
      role: 'admin',
    })
    console.log('Admin created:', admin.email)
  } catch (err) {
    console.log('Admin already exists or error:', (err as Error).message)
  }

  // Create sample products
  const sampleProducts = [
    {
      name: 'Laptop Pro 15',
      description: 'High performance laptop for professionals',
      price: 1299.99,
      stock: 50,
      category: 'electronics',
      attributes: { brand: 'TechPro', ram: '16GB', storage: '512GB SSD' },
    },
    {
      name: 'Wireless Headphones',
      description: 'Premium noise-cancelling wireless headphones',
      price: 299.99,
      stock: 100,
      category: 'electronics',
      attributes: { brand: 'SoundMax', connectivity: 'Bluetooth 5.0' },
    },
    {
      name: 'Running Shoes',
      description: 'Lightweight running shoes for everyday training',
      price: 89.99,
      stock: 200,
      category: 'sports',
      attributes: { brand: 'SpeedRun', material: 'mesh' },
    },
  ]

  for (const productData of sampleProducts) {
    try {
      const product = await createProduct.execute(productData)
      console.log('Product created:', product.name)
    } catch (err) {
      console.log('Product error:', (err as Error).message)
    }
  }

  await mongoose.disconnect()
  console.log('Seed complete')
}

seed().catch(console.error)
