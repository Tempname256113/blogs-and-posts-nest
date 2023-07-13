import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { exceptionFactoryFunction } from '../../../../../generic-factory-functions/exception-factory.function';
import { hash } from 'bcrypt';
import { UserRepositorySQL } from '../../../../admin-api/user/infrastructure/repositories/user.repository-sql';
import { UserPasswordRecoveryInfoType } from '../../../../admin-api/user/api/models/user-api.models';
import { UserQueryRepositorySQL } from '../../../../admin-api/user/infrastructure/repositories/user.query-repository-sql';

export class SetNewPasswordCommand {
  constructor(
    public readonly data: {
      newPassword: string;
      recoveryCode: string;
      errorField: string;
    },
  ) {}
}

@CommandHandler(SetNewPasswordCommand)
export class SetNewPasswordUseCase
  implements ICommandHandler<SetNewPasswordCommand, void>
{
  constructor(
    private usersRepositorySQL: UserRepositorySQL,
    private usersQueryRepositorySQL: UserQueryRepositorySQL,
  ) {}

  async execute({ data }: SetNewPasswordCommand): Promise<void> {
    const foundedPasswordRecoveryInfo: UserPasswordRecoveryInfoType | null =
      await this.usersQueryRepositorySQL.getUserPasswordRecoveryInfoByRecoveryCode(
        data.recoveryCode,
      );
    if (!foundedPasswordRecoveryInfo) {
      throw new BadRequestException(
        exceptionFactoryFunction([data.errorField]),
      );
    }
    const newPasswordHash: string = await hash(data.newPassword, 10);
    await this.usersRepositorySQL.setUserNewPassword({
      newPassword: newPasswordHash,
      userId: foundedPasswordRecoveryInfo.userId,
    });
  }
}
