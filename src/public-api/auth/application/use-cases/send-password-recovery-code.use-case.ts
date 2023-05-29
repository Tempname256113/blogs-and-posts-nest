import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  UserDocument,
  UserSchema,
} from '../../../../../libs/db/mongoose/schemes/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRepository } from '../../../../admin-api/user/infrastructure/repositories/user.repository';
import { NodemailerService } from '../../../../../libs/email/nodemailer/nodemailer.service';

export class SendPasswordRecoveryCodeCommand {
  constructor(public readonly email: string) {}
}

@CommandHandler(SendPasswordRecoveryCodeCommand)
export class SendPasswordRecoveryCodeUseCase
  implements ICommandHandler<SendPasswordRecoveryCodeCommand, void>
{
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    private usersRepository: UserRepository,
    private emailService: NodemailerService,
  ) {}

  async execute({ email }: SendPasswordRecoveryCodeCommand): Promise<void> {
    const foundedUserByEmail: UserDocument | null =
      await this.UserModel.findOne({ 'accountData.email': email });
    if (!foundedUserByEmail) {
      return;
    } else {
      const newPasswordRecoveryCode: string = uuidv4();
      foundedUserByEmail.setPasswordRecoveryCode(newPasswordRecoveryCode);
      await this.usersRepository.saveUser(foundedUserByEmail);
      this.emailService.sendPasswordRecovery(email, newPasswordRecoveryCode);
    }
  }
}
