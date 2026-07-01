export type TransactionStatus = 'pending' | 'paid' | 'cancelled'

export interface TransactionItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export class Transaction {
  readonly _id?: string
  readonly orderNumber: string
  readonly customer: { name: string; email: string }
  readonly items: TransactionItem[]
  readonly total: number
  readonly status: TransactionStatus
  readonly createdAt?: Date

  constructor(data: {
    _id?: string
    orderNumber: string
    customer: { name: string; email: string }
    items: TransactionItem[]
    status?: TransactionStatus
    createdAt?: Date
  }) {
    if (data.items.length === 0) throw new Error('La transacción debe tener al menos un item')
    if (!data.customer.email.includes('@')) throw new Error('Email de cliente inválido')

    this._id = data._id
    this.orderNumber = data.orderNumber
    this.customer = data.customer
    this.items = data.items
    this.total = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    this.status = data.status ?? 'pending'
    this.createdAt = data.createdAt
  }
}
