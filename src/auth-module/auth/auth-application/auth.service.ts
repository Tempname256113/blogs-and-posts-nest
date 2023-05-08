import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  User,
  UserDocument,
  UserSchema,
} from '../../../../libs/db/mongoose/schemes/user.entity';
import { FilterQuery, Model } from 'mongoose';
import { UserApiCreateDto } from '../../user/user-api/user-api-models/user-api.dto';
import { v4 as uuidv4 } from 'uuid';
import { compare, hashSync } from 'bcrypt';
import { add } from 'date-fns';
import { NodemailerService } from '../../../../libs/email/nodemailer/nodemailer.service';
import { AuthRepository } from '../auth-infrastructure/auth-repositories/auth.repository';
import { AuthApiLoginDtoType } from '../auth-api/auth-api-models/auth-api.dto';
import {
  Session,
  SessionDocument,
  SessionSchema,
} from '../../../../libs/db/mongoose/schemes/session.entity';
import { SessionUpdateDTO } from '../auth-infrastructure/auth-repositories/auth-repositories-models/auth-repository.dto';
import { UserRepository } from '../../user/user-infrastructure/user-repositories/user.repository';
import { badRequestErrorFactoryFunction } from '../../../../generic-factory-functions/bad-request.error-factory-function';
import {
  CreateNewTokenPairData,
  CreateNewTokenPairReturnType,
  JwtHelpers,
} from '../../../../libs/auth/jwt/jwt-helpers.service';
import { JwtRefreshTokenPayloadType } from '../../../../generic-models/jwt.payload.model';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    @InjectModel(SessionSchema.name) private SessionModel: Model<SessionSchema>,
    private authRepository: AuthRepository,
    private usersRepository: UserRepository,
    private emailService: NodemailerService,
    private jwtHelpers: JwtHelpers,
  ) {}
  async registrationNewUser(createNewUserDTO: UserApiCreateDto): Promise<void> {
    const checkUserExistence = async (): Promise<void> => {
      const findUserWithSimilarEmailOrLogin =
        async (): Promise<User | null> => {
          const filter: FilterQuery<UserSchema> = {
            $or: [
              { 'accountData.email': createNewUserDTO.email },
              { 'accountData.login': createNewUserDTO.login },
            ],
          };
          const foundedUser: User | null = await this.UserModel.findOne(
            filter,
          ).lean();
          return foundedUser;
        };
      const foundedUser: User | null = await findUserWithSimilarEmailOrLogin();
      let errorField: string | undefined;
      if (foundedUser) {
        if (foundedUser.accountData.email === createNewUserDTO.email) {
          errorField = 'email';
        }
        if (foundedUser.accountData.login === createNewUserDTO.login) {
          errorField = 'login';
        }
      }
      if (errorField) {
        throw new BadRequestException(
          badRequestErrorFactoryFunction([errorField]),
        );
      }
    };
    await checkUserExistence();
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
        recoveryStatus: false,
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
    if (!foundedUser) {
      return null;
    }
    if (foundedUser.passwordRecovery.recoveryStatus) return null;
    const comparePasswords: boolean = await compare(
      loginDTO.password,
      foundedUser.accountData.password,
    );
    if (!comparePasswords) {
      return null;
    }
    return foundedUser;
  }

  async login({
    user,
    clientIpAddress,
    clientDeviceTitle,
  }: {
    user: User;
    clientIpAddress: string;
    clientDeviceTitle: string;
  }): Promise<{ newAccessToken: string; newRefreshToken: string }> {
    const { newRefreshToken, newAccessToken } =
      this.jwtHelpers.createNewTokenPair({
        userId: user.id,
        userLogin: user.accountData.login,
      });
    const createNewSession = (): SessionDocument => {
      const newSessionData: Session = {
        userId: user.id,
        deviceId: newRefreshToken.deviceId,
        iat: newRefreshToken.iat,
        userIpAddress: clientIpAddress,
        userDeviceTitle: clientDeviceTitle,
        lastActiveDate: newRefreshToken.activeDate,
      };
      const newSessionModel: SessionDocument = new this.SessionModel(
        newSessionData,
      );
      return newSessionModel;
    };
    const newCreatedSession: SessionDocument = createNewSession();
    await this.authRepository.saveSession(newCreatedSession);
    return {
      newAccessToken,
      newRefreshToken: newRefreshToken.refreshToken,
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
    if (!foundedUserByEmail) {
      throw new BadRequestException(
        badRequestErrorFactoryFunction([errorField]),
      );
    }
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

  async logout(refreshToken: string): Promise<void> {
    const requestRefreshTokenPayload: JwtRefreshTokenPayloadType | null =
      this.jwtHelpers.verifyRefreshToken(refreshToken);
    if (!requestRefreshTokenPayload) {
      throw new UnauthorizedException();
    }
    const foundedSessionFromDB: SessionDocument | null =
      await this.SessionModel.findOne({
        deviceId: requestRefreshTokenPayload.deviceId,
      });
    if (!foundedSessionFromDB) {
      throw new UnauthorizedException();
    }
    if (foundedSessionFromDB.iat !== requestRefreshTokenPayload.iat) {
      throw new UnauthorizedException();
    }
    await this.authRepository.deleteSession(
      requestRefreshTokenPayload.deviceId,
    );
  }

  async updatePairOfTokens({
    requestRefreshTokenPayload,
    userDeviceTitle,
    userIpAddress,
  }: {
    requestRefreshTokenPayload: JwtRefreshTokenPayloadType;
    userIpAddress: string;
    userDeviceTitle: string;
  }): Promise<{
    newAccessToken: string;
    newRefreshToken: string;
  }> {
    const createNewTokenPairData: CreateNewTokenPairData = {
      userId: requestRefreshTokenPayload.userId,
      userLogin: requestRefreshTokenPayload.userLogin,
      deviceId: requestRefreshTokenPayload.deviceId,
    };
    const newTokenPair: CreateNewTokenPairReturnType =
      this.jwtHelpers.createNewTokenPair(createNewTokenPairData);
    const updateSessionData: SessionUpdateDTO = {
      refreshTokenIat: newTokenPair.newRefreshToken.iat,
      userIpAddress,
      userDeviceTitle,
      lastActiveDate: newTokenPair.newRefreshToken.activeDate,
    };
    const foundedSessionFromDB: SessionDocument =
      await this.SessionModel.findOne({
        deviceId: requestRefreshTokenPayload.deviceId,
      });
    foundedSessionFromDB.updateSession(updateSessionData);
    await this.authRepository.saveSession(foundedSessionFromDB);
    return {
      newAccessToken: newTokenPair.newAccessToken,
      newRefreshToken: newTokenPair.newRefreshToken.refreshToken,
    };
  }

  async sendPasswordRecoveryCode(email: string): Promise<void> {
    const foundedUserByEmail: UserDocument | null =
      await this.UserModel.findOne({ 'accountData.email': email });
    if (!foundedUserByEmail) {
      return;
    } else {
      const newPasswordRecoveryCode: string = uuidv4();
      foundedUserByEmail.setPasswordRecoveryCode(newPasswordRecoveryCode);
      await this.usersRepository.saveUser(foundedUserByEmail);
      this.emailService.sendPasswordRecovery(email, newPasswordRecoveryCode);
    }
  }

  async setNewUserPassword(data: {
    newPassword: string;
    recoveryCode: string;
    errorField: string;
  }): Promise<void> {
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
