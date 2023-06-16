import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoginUserDTO } from '../../api/models/auth-api.dto';
import {
  User,
  UserSchema,
} from '../../../../../libs/db/mongoose/schemes/user.entity';
import { compare } from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

export class ValidateUserCommand {
  constructor(public readonly loginDTO: LoginUserDTO) {}
}

@CommandHandler(ValidateUserCommand)
export class ValidateUserUseCase
  implements ICommandHandler<ValidateUserCommand, User | null>
{
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
  ) {}
  async execute({ loginDTO }: ValidateUserCommand): Promise<User | null> {
    const foundedUser: User | null = await this.UserModel.findOne(
      {
        $or: [
          { 'accountData.login': loginDTO.loginOrEmail },
          { 'accountData.email': loginDTO.loginOrEmail },
        ],
      },
      { _id: false },
    ).lean();
    if (!foundedUser) {
      return null;
    }
    if (foundedUser.passwordRecovery.recoveryStatus) return null;
    if (foundedUser.banStatus.banned) return null;
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
