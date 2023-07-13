import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserCreateDto } from '../../api/models/user-api.dto';
import { UserViewModel } from '../../api/models/user-api.models';
import { UserRepositorySQL } from '../../infrastructure/repositories/user.repository-sql';

export class CreateUserCommand {
  constructor(public readonly createUserDTO: UserCreateDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase
  implements ICommandHandler<CreateUserCommand, UserViewModel>
{
  constructor(private readonly usersRepositorySQL: UserRepositorySQL) {}

  async execute({ createUserDTO }: CreateUserCommand): Promise<UserViewModel> {
    const newUserData: { userId: number; createdAt: string } =
      await this.usersRepositorySQL.createNewUser(createUserDTO);
    const userApiModel: UserViewModel = {
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
