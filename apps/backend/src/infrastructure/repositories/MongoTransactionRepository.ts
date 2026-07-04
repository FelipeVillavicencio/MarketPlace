import { Types } from 'mongoose'
import { ITransactionRepository, TransactionFilters } from '../../interfaces/repositories/ITransactionRepository'
import { Transaction, TransactionStatus } from '../../domain/Transaction'
import { TransactionModel } from '../models/TransactionModel'
import { paginate } from './pagination'

interface TransactionLean {
  _id: Types.ObjectId
  orderNumber: string
  customer: { name: string; email: string }
  items: Array<{ productId: Types.ObjectId; name: string; price: number; quantity: number }>
  total: number
  status: TransactionStatus
  createdAt?: Date
}

function toTransaction(doc: TransactionLean): Transaction {
  return new Transaction({
    _id: doc._id.toString(),
    orderNumber: doc.orderNumber,
    customer: doc.customer,
    items: doc.items.map((i: { productId: Types.ObjectId; name: string; price: number; quantity: number }) => ({
      productId: i.productId.toString(),
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    })),
    status: doc.status,
    createdAt: doc.createdAt,
  })
}

export class MongoTransactionRepository implements ITransactionRepository {
  async create(transaction: Transaction): Promise<Transaction> {
    const doc = await TransactionModel.create(transaction)
    return toTransaction(doc as unknown as TransactionLean)
  }

  async findById(id: string): Promise<Transaction | null> {
    const doc = await TransactionModel.findById(id).lean()
    return doc ? toTransaction(doc as unknown as TransactionLean) : null
  }

  async findAll(filters: TransactionFilters): Promise<{ data: Transaction[]; total: number }> {
    const { limit, skip } = paginate(filters.page, filters.limit)
    const query: Record<string, unknown> = {}
    if (filters.status) query.status = filters.status

    const [docs, total] = await Promise.all([
      TransactionModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      TransactionModel.countDocuments(query),
    ])
    return { data: (docs as unknown as TransactionLean[]).map(toTransaction), total }
  }

  async updateStatus(id: string, status: TransactionStatus): Promise<Transaction | null> {
    const doc = await TransactionModel.findByIdAndUpdate(id, { status }, { new: true }).lean()
    return doc ? toTransaction(doc as unknown as TransactionLean) : null
  }
}
