import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  User,
  UserDocument,
  UserSchema,
} from '../../auth-domain/user/user.entity';
import { Model } from 'mongoose';
import { UserRepository } from '../user-infrastructure/user-repositories/user.repository';
import { IUserApiCreateDto } from '../user-api/user-api-models/user-api.dto';
import { hashSync } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { IUserApiModel } from '../user-api/user-api-models/user-api.model';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    private userRepository: UserRepository,
  ) {}
  async createUser(createUserDTO: IUserApiCreateDto): Promise<IUserApiModel> {
    const passwordHash: string = hashSync(createUserDTO.password, 10);
    const newUser: User = {
      id: uuidv4(),
      login: createUserDTO.login,
      password: passwordHash,
      email: createUserDTO.email,
      createdAt: new Date().toISOString(),
    };
    const userApiModel: IUserApiModel = {
      id: newUser.id,
      login: newUser.login,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };
    const newUserModel: UserDocument = new this.UserModel(newUser);
    await this.userRepository.createUser(newUserModel);
    return userApiModel;
  }
}
