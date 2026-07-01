import { IUserRepository } from '../../../interfaces/repositories/IUserRepository'
import { NotFoundError } from '../../../domain/errors'

export class DeleteUserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.userRepo.delete(id)
    if (!deleted) throw new NotFoundError('Usuario no encontrado')
  }
}
