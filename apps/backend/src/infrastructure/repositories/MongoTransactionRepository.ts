import { ITransactionRepository, TransactionFilters } from '../../interfaces/repositories/ITransactionRepository'
import { Transaction, TransactionStatus } from '../../domain/Transaction'
import { TransactionModel } from '../models/TransactionModel'

function toTransaction(doc: any): Transaction {
  return new Transaction({
    _id: doc._id.toString(),
    orderNumber: doc.orderNumber,
    customer: doc.customer,
    items: doc.items.map((i: any) => ({
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
    return toTransaction(doc)
  }

  async findById(id: string): Promise<Transaction | null> {
    const doc = await TransactionModel.findById(id).lean()
    return doc ? toTransaction(doc) : null
  }

  async findAll(filters: TransactionFilters): Promise<{ data: Transaction[]; total: number }> {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    const query: Record<string, unknown> = {}
    if (filters.status) query.status = filters.status

    const [docs, total] = await Promise.all([
      TransactionModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      TransactionModel.countDocuments(query),
    ])
    return { data: docs.map(toTransaction), total }
  }

  async updateStatus(id: string, status: TransactionStatus): Promise<Transaction | null> {
    const doc = await TransactionModel.findByIdAndUpdate(id, { status }, { new: true }).lean()
    return doc ? toTransaction(doc) : null
  }
}
