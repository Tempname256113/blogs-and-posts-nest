import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  UserDocument,
  UserSchema,
} from '../../../../../libs/db/mongoose/schemes/user.entity';
import { BadRequestException } from '@nestjs/common';
import { badRequestErrorFactoryFunction } from '../../../../../generic-factory-functions/bad-request.error-factory-function';
import { hashSync } from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRepository } from '../../../user/user-infrastructure/user-repositories/user.repository';

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
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    private usersRepository: UserRepository,
  ) {}

  async execute({ data }: SetNewPasswordCommand): Promise<void> {
    const foundedUser: UserDocument | null = await this.UserModel.findOne({
      'passwordRecovery.recoveryCode': data.recoveryCode,
    });
    if (!foundedUser) {
      throw new BadRequestException(
        badRequestErrorFactoryFunction([data.errorField]),
      );
    }
    const newPasswordHash: string = hashSync(data.newPassword, 10);
    foundedUser.setNewPassword(newPasswordHash);
    await this.usersRepository.saveUser(foundedUser);
  }
}
