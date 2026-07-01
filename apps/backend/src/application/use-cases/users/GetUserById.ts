import { IUserRepository } from '../../../interfaces/repositories/IUserRepository'
import { User } from '../../../domain/User'

export class GetUserByIdUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(id: string): Promise<User> {
    const user = await this.userRepo.findById(id)
    if (!user) throw new Error('User not found')
    return user
  }
}
