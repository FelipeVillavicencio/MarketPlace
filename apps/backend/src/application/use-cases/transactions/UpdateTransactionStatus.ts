import { ITransactionRepository } from '../../../interfaces/repositories/ITransactionRepository'
import { Transaction, TransactionStatus } from '../../../domain/Transaction'
import { NotFoundError } from '../../../domain/errors'

export class UpdateTransactionStatusUseCase {
  constructor(private transactionRepo: ITransactionRepository) {}

  async execute(id: string, status: TransactionStatus): Promise<Transaction> {
    const transaction = await this.transactionRepo.updateStatus(id, status)
    if (!transaction) throw new NotFoundError('Transacción no encontrada')
    return transaction
  }
}
