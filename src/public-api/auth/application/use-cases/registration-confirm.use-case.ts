import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { exceptionFactoryFunction } from '../../../../../generic-factory-functions/exception-factory.function';
import { UserRepositorySQL } from '../../../../admin-api/user/infrastructure/repositories/user.repository-sql';
import { UserQueryRepositorySQL } from '../../../../admin-api/user/infrastructure/repositories/user.query-repository-sql';
import { UserEmailInfoType } from '../../../../admin-api/user/api/models/user-api.models';

export class ConfirmRegistrationCommand {
  constructor(
    public readonly confirmationCode: string,
    public readonly errorField: string,
  ) {}
}

@CommandHandler(ConfirmRegistrationCommand)
export class RegistrationConfirmUseCase
  implements ICommandHandler<ConfirmRegistrationCommand, void>
{
  constructor(
    private readonly usersRepositorySQL: UserRepositorySQL,
    private usersQueryRepositorySQL: UserQueryRepositorySQL,
  ) {}

  async execute({
    confirmationCode,
    errorField,
  }: ConfirmRegistrationCommand): Promise<void> {
    const userEmailInfo: UserEmailInfoType | null =
      await this.usersQueryRepositorySQL.getUserEmailInfoByConfirmationCode(
        confirmationCode,
      );
    if (
      !userEmailInfo ||
      new Date().toISOString() > userEmailInfo.expirationDate
    ) {
      throw new BadRequestException(exceptionFactoryFunction([errorField]));
    }
    await this.usersRepositorySQL.confirmUserRegistration(confirmationCode);
  }
}
