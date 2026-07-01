import { ITransactionRepository } from '../../../interfaces/repositories/ITransactionRepository'
import { Transaction } from '../../../domain/Transaction'
import { GetTransactionsDTO } from '../../dtos/transaction.dto'

export class GetTransactionsUseCase {
  constructor(private transactionRepo: ITransactionRepository) {}

  async execute(dto: GetTransactionsDTO = {}): Promise<{ data: Transaction[]; total: number }> {
    return this.transactionRepo.findAll(dto)
  }
}
