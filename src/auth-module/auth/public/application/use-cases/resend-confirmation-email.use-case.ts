import { ICommandHandler } from '@nestjs/cqrs';
import {
  UserDocument,
  UserSchema,
} from '../../../../../../libs/db/mongoose/schemes/user.entity';
import { BadRequestException } from '@nestjs/common';
import { badRequestErrorFactoryFunction } from '../../../../../../generic-factory-functions/bad-request.error-factory-function';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { UserRepository } from '../../../../user/user-infrastructure/user-repositories/user.repository';
import { NodemailerService } from '../../../../../../libs/email/nodemailer/nodemailer.service';

export class ResendConfirmationEmailCommand {
  constructor(
    public readonly email: string,
    public readonly errorField: string,
  ) {}
}

export class ResendConfirmationEmailUseCase
  implements ICommandHandler<ResendConfirmationEmailCommand, void>
{
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    private usersRepository: UserRepository,
    private emailService: NodemailerService,
  ) {}
  async execute({
    email,
    errorField,
  }: ResendConfirmationEmailCommand): Promise<void> {
    const foundedUserByEmail: UserDocument | null =
      await this.UserModel.findOne({ 'accountData.email': email });
    if (!foundedUserByEmail) {
      throw new BadRequestException(
        badRequestErrorFactoryFunction([errorField]),
      );
    }
    const confirmationCode: string = randomUUID();
    const changeConfirmationEmailCodeStatus: boolean =
      foundedUserByEmail.changeEmailConfirmationCode(confirmationCode);
    if (!changeConfirmationEmailCodeStatus) {
      throw new BadRequestException(
        badRequestErrorFactoryFunction([errorField]),
      );
    }
    await this.usersRepository.saveUser(foundedUserByEmail);
    this.emailService.sendUserConfirmation(email, confirmationCode);
  }
}
