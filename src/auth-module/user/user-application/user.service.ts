import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  User,
  UserDocument,
  UserSchema,
} from '../../auth-module-domain/user/user.entity';
import { Model } from 'mongoose';
import { UserRepository } from '../user-infrastructure/user-repositories/user.repository';
import { UserApiCreateDto } from '../user-api/user-api-models/user-api.dto';
import { hashSync } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { IUserApiModel } from '../user-api/user-api-models/user-api.models';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    private userRepository: UserRepository,
  ) {}
  async createUser(createUserDTO: UserApiCreateDto): Promise<IUserApiModel> {
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
      },
    };
    const userApiModel: IUserApiModel = {
      id: newUser.id,
      login: newUser.accountData.login,
      email: newUser.accountData.email,
      createdAt: newUser.accountData.createdAt,
    };
    const newUserModel: UserDocument = new this.UserModel(newUser);
    await this.userRepository.saveUser(newUserModel);
    return userApiModel;
  }

  async deleteUserById(userId: string): Promise<boolean> {
    return this.userRepository.deleteUserById(userId);
  }
}
