import { IUserRepository } from '../../../interfaces/repositories/IUserRepository'
import { User } from '../../../domain/User'

export class GetUsersUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(page = 1, limit = 20): Promise<{ data: User[]; total: number }> {
    return this.userRepo.findAll({ page, limit })
  }
}
