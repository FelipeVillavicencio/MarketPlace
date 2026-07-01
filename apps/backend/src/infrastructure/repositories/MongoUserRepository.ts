import { Types } from 'mongoose'
import { IUserRepository, UserFilters } from '../../interfaces/repositories/IUserRepository'
import { User, UserRole } from '../../domain/User'
import { UserModel } from '../models/UserModel'

interface UserLean {
  _id: Types.ObjectId
  name: string
  email: string
  passwordHash: string
  role: UserRole
  createdAt?: Date
  updatedAt?: Date
}

function toUser(doc: UserLean): User {
  return new User({
    _id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash,
    role: doc.role,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  })
}

export class MongoUserRepository implements IUserRepository {
  async create(user: User): Promise<User> {
    const doc = await UserModel.create(user)
    return toUser(doc as unknown as UserLean)
  }

  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).lean()
    return doc ? toUser(doc as unknown as UserLean) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean()
    return doc ? toUser(doc as unknown as UserLean) : null
  }

  async findAll(filters: UserFilters): Promise<{ data: User[]; total: number }> {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    const [docs, total] = await Promise.all([
      UserModel.find().skip((page - 1) * limit).limit(limit).lean(),
      UserModel.countDocuments(),
    ])
    return { data: (docs as unknown as UserLean[]).map(toUser), total }
  }

  async update(id: string, data: Partial<Omit<User, '_id' | 'createdAt' | 'updatedAt'>>): Promise<User | null> {
    const doc = await UserModel.findByIdAndUpdate(id, data, { new: true }).lean()
    return doc ? toUser(doc as unknown as UserLean) : null
  }

  async delete(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id)
    return result !== null
  }
}
