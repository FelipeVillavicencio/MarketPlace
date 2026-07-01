import { TransactionStatus } from '../../domain/Transaction'

export interface CreateTransactionDTO {
  customer: { name: string; email: string }
  items: Array<{ productId: string; name: string; price: number; quantity: number }>
}

export interface GetTransactionsDTO {
  status?: TransactionStatus
  page?: number
  limit?: number
}
