import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  User,
  UserDocument,
  UserSchema,
} from '../../../../libs/db/mongoose/schemes/user.entity';
import { Model } from 'mongoose';
import { UserRepository } from '../user-infrastructure/user-repositories/user.repository';
import { UserApiCreateDto } from '../user-api/user-api-models/user-api.dto';
import { hashSync } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserApiModelType } from '../user-api/user-api-models/user-api.models';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    private userRepository: UserRepository,
  ) {}
  async createUser(createUserDTO: UserApiCreateDto): Promise<UserApiModelType> {
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
    };
    const userApiModel: UserApiModelType = {
      id: newUser.id,
      login: newUser.accountData.login,
      email: newUser.accountData.email,
      createdAt: new Date(newUser.accountData.createdAt).toISOString(),
    };
    const newUserModel: UserDocument = new this.UserModel(newUser);
    await this.userRepository.saveUser(newUserModel);
    return userApiModel;
  }

  async deleteUserById(userId: string): Promise<void> {
    const deleteUserStatus: boolean = await this.userRepository.deleteUserById(
      userId,
    );
    if (!deleteUserStatus) throw new NotFoundException();
  }
}
