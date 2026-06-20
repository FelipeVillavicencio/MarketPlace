export type TransactionStatus = 'pending' | 'paid' | 'cancelled'

export interface ITransactionItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export interface ITransaction {
  _id: string
  orderNumber: string
  customer: {
    name: string
    email: string
  }
  items: ITransactionItem[]
  total: number
  status: TransactionStatus
  createdAt: string
}
