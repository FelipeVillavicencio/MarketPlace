import { IUserRepository } from '../../../interfaces/repositories/IUserRepository'

export class DeleteUserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.userRepo.delete(id)
    if (!deleted) throw new Error('Usuario no encontrado')
  }
}
