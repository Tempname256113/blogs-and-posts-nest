import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  User,
  UserDocument,
  UserSchema,
} from '../../auth-module-domain/user/user.entity';
import { Model } from 'mongoose';
import { UserApiCreateDto } from '../../user/user-api/user-api-models/user-api.dto';
import { v4 as uuidv4 } from 'uuid';
import { compare, compareSync, hashSync } from 'bcrypt';
import { add } from 'date-fns';
import { AuthEmailAdapterService } from '../auth-infrastructure/auth-adapters/auth.email-adapter.service';
import { AuthRepository } from '../auth-infrastructure/auth-repositories/auth.repository';
import { AuthApiLoginDtoType } from '../auth-api/auth-api-models/auth-api.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    private authRepository: AuthRepository,
    private emailService: AuthEmailAdapterService,
  ) {}
  async registrationNewUser(createNewUserDTO: UserApiCreateDto) {
    const findUserWithSimilarEmail = async (): Promise<boolean> => {
      const foundedUser: UserDocument | null = await this.UserModel.findOne({
        'accountData.email': createNewUserDTO.email,
      });
      return !!foundedUser;
    };
    const foundedUserWithSimilarEmail: boolean =
      await findUserWithSimilarEmail();
    if (foundedUserWithSimilarEmail) {
      throw new BadRequestException({
        errorsMessages: [
          {
            message: 'invalid data',
            field: 'email',
          },
        ],
      });
    }
    const passwordHash: string = hashSync(createNewUserDTO.password, 10);
    const emailConfirmationCode: string = uuidv4();
    const newUser: User = {
      id: uuidv4(),
      accountData: {
        login: createNewUserDTO.login,
        email: createNewUserDTO.email,
        password: passwordHash,
        createdAt: new Date().toISOString(),
      },
      emailConfirmation: {
        confirmationCode: emailConfirmationCode,
        expirationDate: add(new Date(), { days: 3 }).toISOString(),
        isConfirmed: false,
      },
      passwordRecovery: {
        recoveryCode: null,
      },
    };
    const newUserModel: UserDocument = new this.UserModel(newUser);
    this.emailService.sendUserConfirmation(
      createNewUserDTO.email,
      emailConfirmationCode,
    );
    await this.authRepository.saveUser(newUserModel);
  }

  async validateUser(loginDTO: AuthApiLoginDtoType) {
    const foundedUser: User | null = await this.UserModel.findOne(
      {
        $or: [
          { 'accountData.login': loginDTO.loginOrEmail },
          { 'accountData.email': loginDTO.loginOrEmail },
        ],
      },
      { _id: false },
    );
    if (foundedUser !== null) {
      const comparePassword = await compare(
        loginDTO.password,
        foundedUser.accountData.password,
      );
      if (comparePassword) return foundedUser;
    }
    return null;
  }

  // async login() {}
}
