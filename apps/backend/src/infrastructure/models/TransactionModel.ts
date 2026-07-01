import mongoose, { Schema, Document } from 'mongoose'
import { TransactionStatus } from '../../domain/Transaction'

export interface TransactionDocument extends Document {
  orderNumber: string
  customer: { name: string; email: string }
  items: Array<{ productId: mongoose.Types.ObjectId; name: string; price: number; quantity: number }>
  total: number
  status: TransactionStatus
}

const transactionSchema = new Schema<TransactionDocument>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    total: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
  },
  { timestamps: true }
)

export const TransactionModel = mongoose.model<TransactionDocument>('Transaction', transactionSchema)
