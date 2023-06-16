import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserApiCreateDto } from '../../api/models/user-api.dto';
import { UserViewModel } from '../../api/models/user-api.models';
import { hashSync } from 'bcrypt';
import {
  User,
  UserDocument,
  UserSchema,
} from '../../../../../libs/db/mongoose/schemes/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { v4 as uuidv4 } from 'uuid';

export class CreateUserCommand {
  constructor(public readonly createUserDTO: UserApiCreateDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase
  implements ICommandHandler<CreateUserCommand, UserViewModel>
{
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    private userRepository: UserRepository,
  ) {}

  async execute({ createUserDTO }: CreateUserCommand): Promise<UserViewModel> {
    const passwordHash: string = hashSync(createUserDTO.password, 10);
    const newUser: User = {
      id: uuidv4(),
      accountData: {
        login: createUserDTO.login,
        email: createUserDTO.email,
        password: passwordHash,
        createdAt: new Date().toISOString(),
      },
      emailConfirmation: {
        confirmationCode: null,
        expirationDate: null,
        isConfirmed: true,
      },
      passwordRecovery: {
        recoveryCode: null,
        recoveryStatus: false,
      },
      banStatus: {
        banned: false,
        banReason: null,
        banDate: null,
      },
    };
    const userApiModel: UserViewModel = {
      id: newUser.id,
      login: newUser.accountData.login,
      email: newUser.accountData.email,
      createdAt: newUser.accountData.createdAt,
      banInfo: {
        isBanned: newUser.banStatus.banned,
        banDate: newUser.banStatus.banDate,
        banReason: newUser.banStatus.banReason,
      },
    };
    const newUserModel: UserDocument = new this.UserModel(newUser);
    await this.userRepository.saveUser(newUserModel);
    return userApiModel;
  }
}
