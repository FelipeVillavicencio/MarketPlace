import { ITransactionRepository } from '../../../interfaces/repositories/ITransactionRepository'
import { Transaction } from '../../../domain/Transaction'
import { NotFoundError } from '../../../domain/errors'

export class GetTransactionByIdUseCase {
  constructor(private transactionRepo: ITransactionRepository) {}

  async execute(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepo.findById(id)
    if (!transaction) throw new NotFoundError('Transaction not found')
    return transaction
  }
}
