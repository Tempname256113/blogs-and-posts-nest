import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserCreateDto } from '../../api/models/user-api.dto';
import { AdminApiUserViewModel } from '../../api/models/user-api.models';
import { UserRepositorySQL } from '../../infrastructure/repositories/user.repository-sql';
import { hash } from 'bcrypt';

export class CreateUserCommand {
  constructor(public readonly createUserDTO: UserCreateDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase
  implements ICommandHandler<CreateUserCommand, AdminApiUserViewModel>
{
  constructor(private readonly usersRepositorySQL: UserRepositorySQL) {}

  async execute({
    createUserDTO,
  }: CreateUserCommand): Promise<AdminApiUserViewModel> {
    const passwordHash: string = await hash(createUserDTO.password, 10);
    const newUserData: { userId: number; createdAt: string } =
      await this.usersRepositorySQL.createNewUser({
        login: createUserDTO.login,
        password: passwordHash,
        email: createUserDTO.email,
      });
    const userApiModel: AdminApiUserViewModel = {
      id: String(newUserData.userId),
      login: createUserDTO.login,
      email: createUserDTO.email,
      createdAt: newUserData.createdAt,
      banInfo: {
        isBanned: false,
        banReason: null,
        banDate: null,
      },
    };
    return userApiModel;
  }
}
