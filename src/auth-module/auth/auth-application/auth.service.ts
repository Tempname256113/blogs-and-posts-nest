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
import { compare, hashSync } from 'bcrypt';
import { add, getUnixTime } from 'date-fns';
import { AuthEmailAdapterService } from '../auth-infrastructure/auth-adapters/auth.email-adapter.service';
import { AuthRepository } from '../auth-infrastructure/auth-repositories/auth.repository';
import { AuthApiLoginDtoType } from '../auth-api/auth-api-models/auth-api.dto';
import { JwtService } from '@nestjs/jwt';
import { EnvConfiguration } from '../../../app-configuration/environment/env-configuration';
import {
  Session,
  SessionDocument,
  SessionSchema,
} from '../../auth-module-domain/auth/session.entity';
import { SessionUpdateDTO } from '../auth-infrastructure/auth-repositories/auth-repositories-models/auth-repository.dto';
import { UserRepository } from '../../user/user-infrastructure/user-repositories/user.repository';
import { badRequestErrorFactoryFunction } from '../../../app-helpers/factory-functions/bad-request.error-factory-function';
import { JwtHelpers } from '../../../app-helpers/jwt/jwt.helpers';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    @InjectModel(SessionSchema.name) private SessionModel: Model<SessionSchema>,
    private authRepository: AuthRepository,
    private usersRepository: UserRepository,
    private emailService: AuthEmailAdapterService,
    private jwtHelpers: JwtHelpers,
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
      throw new BadRequestException(badRequestErrorFactoryFunction(['email']));
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
    await this.usersRepository.saveUser(newUserModel);
  }

  async validateUser(loginDTO: AuthApiLoginDtoType): Promise<User | null> {
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

  async login(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { refreshToken, accessToken, refreshTokenIat } =
      this.jwtHelpers.createPairOfTokens({ userId: user.id });
    const createNewSession = (): SessionDocument => {
      const newSessionData: Session = {
        userId: user.id,
        iat: refreshTokenIat,
      };
      const newSessionModel: SessionDocument = new this.SessionModel(
        newSessionData,
      );
      return newSessionModel;
    };
    const handleSession = async (): Promise<void> => {
      const foundedSession: SessionDocument | null =
        await this.SessionModel.findOne({
          userId: user.id,
        });
      if (foundedSession) {
        const sessionUpdateData: SessionUpdateDTO = {
          refreshTokenIat,
        };
        foundedSession.updateSession(sessionUpdateData);
        await this.authRepository.saveSession(foundedSession);
      } else {
        const newSession: SessionDocument = createNewSession();
        await this.authRepository.saveSession(newSession);
      }
    };
    handleSession();
    return {
      accessToken,
      refreshToken,
    };
  }

  async confirmRegistration(
    confirmationCode: string,
    errorField: string,
  ): Promise<void> {
    const foundedUserByConfirmationCode: UserDocument | null =
      await this.UserModel.findOne({
        'emailConfirmation.confirmationCode': confirmationCode,
      });
    if (!foundedUserByConfirmationCode) {
      throw new BadRequestException(
        badRequestErrorFactoryFunction([errorField]),
      );
    } else if (!foundedUserByConfirmationCode.confirmRegistration()) {
      throw new BadRequestException(
        badRequestErrorFactoryFunction([errorField]),
      );
    }
    await this.usersRepository.saveUser(foundedUserByConfirmationCode);
  }

  async emailResending(email: string, errorField: string): Promise<void> {
    const foundedUserByEmail: UserDocument | null =
      await this.UserModel.findOne({ 'accountData.email': email });
    if (foundedUserByEmail) {
      const confirmationCode: string = uuidv4();
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
}
