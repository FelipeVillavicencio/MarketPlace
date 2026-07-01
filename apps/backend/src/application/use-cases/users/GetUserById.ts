import { IUserRepository } from '../../../interfaces/repositories/IUserRepository'
import { User } from '../../../domain/User'
import { NotFoundError } from '../../../domain/errors'

export class GetUserByIdUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(id: string): Promise<User> {
    const user = await this.userRepo.findById(id)
    if (!user) throw new NotFoundError('User not found')
    return user
  }
}
