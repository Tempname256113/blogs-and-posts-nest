import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { exceptionFactoryFunction } from '../../../../../generic-factory-functions/exception-factory.function';
import { randomUUID } from 'crypto';
import { NodemailerService } from '../../../../../libs/email/nodemailer/nodemailer.service';
import { UserEmailInfoType } from '../../../../admin-api/user/api/models/user-api.models';
import { UserRepositorySql } from '../../../../admin-api/user/infrastructure/repositories/user.repository-sql';
import { UserQueryRepositorySQL } from '../../../../admin-api/user/infrastructure/repositories/user.query-repository-sql';

export class ResendConfirmationEmailCommand {
  constructor(
    public readonly email: string,
    public readonly errorField: string,
  ) {}
}

@CommandHandler(ResendConfirmationEmailCommand)
export class ResendConfirmationEmailUseCase
  implements ICommandHandler<ResendConfirmationEmailCommand, void>
{
  constructor(
    private usersRepositorySQL: UserRepositorySql,
    private usersQueryRepositorySQL: UserQueryRepositorySQL,
    private emailService: NodemailerService,
  ) {}
  async execute({
    email,
    errorField,
  }: ResendConfirmationEmailCommand): Promise<void> {
    const userEmailInfo: UserEmailInfoType | null =
      await this.usersQueryRepositorySQL.getUserEmailInfoByEmail(email);
    if (!userEmailInfo || userEmailInfo.isConfirmed) {
      throw new BadRequestException(exceptionFactoryFunction([errorField]));
    }
    const confirmationCode: string = randomUUID();
    await this.usersRepositorySQL.updateEmailConfirmationCode({
      newCode: confirmationCode,
      email,
    });
    this.emailService.sendUserConfirmation(email, confirmationCode);
  }
}
