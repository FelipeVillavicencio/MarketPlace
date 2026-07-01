import { IUserRepository } from '../../../interfaces/repositories/IUserRepository'
import { User } from '../../../domain/User'
import { UpdateUserDTO } from '../../dtos/user.dto'
import { NotFoundError } from '../../../domain/errors'

export class UpdateUserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(id: string, dto: UpdateUserDTO): Promise<User> {
    const user = await this.userRepo.update(id, dto)
    if (!user) throw new NotFoundError('Usuario no encontrado')
    return user
  }
}
