import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NodemailerService } from '../../../../../libs/email/nodemailer/nodemailer.service';
import { UserRepositorySQL } from '../../../../admin-api/user/infrastructure/repositories/user.repository-sql';
import { randomUUID } from 'crypto';

export class SendPasswordRecoveryCodeCommand {
  constructor(public readonly email: string) {}
}

@CommandHandler(SendPasswordRecoveryCodeCommand)
export class SendPasswordRecoveryCodeUseCase
  implements ICommandHandler<SendPasswordRecoveryCodeCommand, void>
{
  constructor(
    private usersRepositorySQL: UserRepositorySQL,
    private emailService: NodemailerService,
  ) {}

  async execute({ email }: SendPasswordRecoveryCodeCommand): Promise<void> {
    const newPasswordRecoveryCode: string = randomUUID();
    await this.usersRepositorySQL.setPasswordRecoveryCode({
      passwordRecoveryCode: newPasswordRecoveryCode,
      email,
    });
    this.emailService.sendPasswordRecovery(email, newPasswordRecoveryCode);
  }
}
