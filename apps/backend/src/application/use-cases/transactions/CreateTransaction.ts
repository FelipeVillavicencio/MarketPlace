import { ITransactionRepository } from '../../../interfaces/repositories/ITransactionRepository'
import { Transaction } from '../../../domain/Transaction'
import { CreateTransactionDTO } from '../../dtos/transaction.dto'

function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD-${year}-${random}`
}

export class CreateTransactionUseCase {
  constructor(private transactionRepo: ITransactionRepository) {}

  async execute(dto: CreateTransactionDTO): Promise<Transaction> {
    const transaction = new Transaction({
      orderNumber: generateOrderNumber(),
      customer: dto.customer,
      items: dto.items,
    })
    return this.transactionRepo.create(transaction)
  }
}
