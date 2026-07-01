import { Transaction, TransactionStatus } from '../../domain/Transaction'

export interface TransactionFilters {
  status?: TransactionStatus
  page?: number
  limit?: number
}

export interface ITransactionRepository {
  create(transaction: Transaction): Promise<Transaction>
  findById(id: string): Promise<Transaction | null>
  findAll(filters: TransactionFilters): Promise<{ data: Transaction[]; total: number }>
  updateStatus(id: string, status: TransactionStatus): Promise<Transaction | null>
}
