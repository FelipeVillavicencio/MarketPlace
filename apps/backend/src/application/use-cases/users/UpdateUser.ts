import { IUserRepository } from '../../../interfaces/repositories/IUserRepository'
import { User } from '../../../domain/User'
import { UpdateUserDTO } from '../../dtos/user.dto'

export class UpdateUserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(id: string, dto: UpdateUserDTO): Promise<User> {
    const user = await this.userRepo.update(id, dto)
    if (!user) throw new Error('Usuario no encontrado')
    return user
  }
}
