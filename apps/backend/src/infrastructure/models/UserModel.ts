import mongoose, { Schema, Document } from 'mongoose'
import { UserRole } from '../../domain/User'

export interface UserDocument extends Document {
  name: string
  email: string
  passwordHash: string
  role: UserRole
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
  },
  { timestamps: true }
)

export const UserModel = mongoose.model<UserDocument>('User', userSchema)
