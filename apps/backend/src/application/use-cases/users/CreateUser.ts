import { IUserRepository } from '../../../interfaces/repositories/IUserRepository'
import { IAuthService } from '../../../interfaces/services/IAuthService'
import { User } from '../../../domain/User'
import { CreateUserDTO } from '../../dtos/user.dto'
import { ValidationError } from '../../../domain/errors'

export class CreateUserUseCase {
  constructor(
    private userRepo: IUserRepository,
    private authService: IAuthService,
  ) {}

  async execute(dto: CreateUserDTO): Promise<User> {
    const existing = await this.userRepo.findByEmail(dto.email)
    if (existing) throw new ValidationError('El email ya está registrado')

    const passwordHash = await this.authService.hashPassword(dto.password)
    const user = new User({ name: dto.name, email: dto.email, passwordHash, role: dto.role })
    return this.userRepo.create(user)
  }
}
