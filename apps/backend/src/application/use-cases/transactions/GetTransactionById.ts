import { ITransactionRepository } from '../../../interfaces/repositories/ITransactionRepository'
import { Transaction } from '../../../domain/Transaction'

export class GetTransactionByIdUseCase {
  constructor(private transactionRepo: ITransactionRepository) {}

  async execute(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepo.findById(id)
    if (!transaction) throw new Error('Transaction not found')
    return transaction
  }
}
