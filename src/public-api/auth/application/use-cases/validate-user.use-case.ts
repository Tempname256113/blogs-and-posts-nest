import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoginUserDTO } from '../../api/models/auth-api.dto';
import { User } from '../../../../../libs/db/mongoose/schemes/user.entity';
import { compare } from 'bcrypt';
import { UserQueryRepositorySQL } from '../../../../admin-api/user/infrastructure/repositories/user.query-repository-sql';

export class ValidateUserCommand {
  constructor(public readonly loginDTO: LoginUserDTO) {}
}

@CommandHandler(ValidateUserCommand)
export class ValidateUserUseCase
  implements ICommandHandler<ValidateUserCommand, User | null>
{
  constructor(
    private readonly usersQueryRepositorySQL: UserQueryRepositorySQL,
  ) {}

  async execute({ loginDTO }: ValidateUserCommand): Promise<User | null> {
    const foundedUser: User | null =
      await this.usersQueryRepositorySQL.findUserWithSimilarLoginOrEmail({
        email: loginDTO.loginOrEmail,
        login: loginDTO.loginOrEmail,
      });
    if (!foundedUser) {
      return null;
    }
    if (foundedUser.passwordRecovery.recoveryStatus) return null;
    if (foundedUser.banInfo.isBanned) return null;
    const comparePasswords: boolean = await compare(
      loginDTO.password,
      foundedUser.accountData.password,
    );
    if (!comparePasswords) {
      return null;
    }
    return foundedUser;
  }
}
