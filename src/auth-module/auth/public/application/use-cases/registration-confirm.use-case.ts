import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  UserDocument,
  UserSchema,
} from '../../../../../../libs/db/mongoose/schemes/user.entity';
import { BadRequestException } from '@nestjs/common';
import { badRequestErrorFactoryFunction } from '../../../../../../generic-factory-functions/bad-request.error-factory-function';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRepository } from '../../../../user/user-infrastructure/user-repositories/user.repository';

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
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    private readonly usersRepository: UserRepository,
  ) {}

  async execute({
    confirmationCode,
    errorField,
  }: ConfirmRegistrationCommand): Promise<void> {
    const foundedUserByConfirmationCode: UserDocument | null =
      await this.UserModel.findOne({
        'emailConfirmation.confirmationCode': confirmationCode,
      });
    if (
      !foundedUserByConfirmationCode ||
      !foundedUserByConfirmationCode.confirmRegistration()
    ) {
      throw new BadRequestException(
        badRequestErrorFactoryFunction([errorField]),
      );
    }
    await this.usersRepository.saveUser(foundedUserByConfirmationCode);
  }
}
