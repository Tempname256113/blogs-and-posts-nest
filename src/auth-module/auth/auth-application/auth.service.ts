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
} from '../../auth-module-domain/user/user.entity';
import { FilterQuery, Model } from 'mongoose';
import { UserApiCreateDto } from '../../user/user-api/user-api-models/user-api.dto';
import { v4 as uuidv4 } from 'uuid';
import { compare, hashSync } from 'bcrypt';
import { add } from 'date-fns';
import { AuthEmailAdapterService } from '../auth-infrastructure/auth-adapters/auth.email-adapter.service';
import { AuthRepository } from '../auth-infrastructure/auth-repositories/auth.repository';
import { AuthApiLoginDtoType } from '../auth-api/auth-api-models/auth-api.dto';
import {
  Session,
  SessionDocument,
  SessionSchema,
} from '../../auth-module-domain/auth/session.entity';
import { SessionUpdateDTO } from '../auth-infrastructure/auth-repositories/auth-repositories-models/auth-repository.dto';
import { UserRepository } from '../../user/user-infrastructure/user-repositories/user.repository';
import { badRequestErrorFactoryFunction } from '../../../app-helpers/factory-functions/bad-request.error-factory-function';
import { JwtHelpers } from '../../../app-helpers/jwt/jwt.helpers';
import { JwtRefreshTokenPayloadType } from '../../../app-models/jwt.payload.model';

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
    const findUserWithSimilarEmailOrLogin = async (): Promise<
      string | null
    > => {
      const filter: FilterQuery<UserSchema> = {
        $or: [
          { 'accountData.email': createNewUserDTO.email },
          { 'accountData.login': createNewUserDTO.login },
        ],
      };
      const foundedUser: User | null = await this.UserModel.findOne(
        filter,
      ).lean();
      let errorField: string;
      if (foundedUser) {
        if (foundedUser.accountData.email === createNewUserDTO.email) {
          errorField = 'email';
        }
        if (foundedUser.accountData.login === createNewUserDTO.login) {
          errorField = 'login';
        }
      }
      return errorField ? errorField : null;
    };
    const foundedExistingField: string | null =
      await findUserWithSimilarEmailOrLogin();
    if (foundedExistingField) {
      throw new BadRequestException(
        badRequestErrorFactoryFunction([foundedExistingField]),
      );
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
    if (foundedUser !== null) {
      if (foundedUser.passwordRecovery.recoveryStatus) return null;
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
  ): Promise<{ newAccessToken: string; newRefreshToken: string }> {
    const { newRefreshToken, newAccessToken, newRefreshTokenIat } =
      this.jwtHelpers.createPairOfTokens({ userId: user.id });
    const createNewSession = (): SessionDocument => {
      const newSessionData: Session = {
        userId: user.id,
        iat: newRefreshTokenIat,
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
          refreshTokenIat: newRefreshTokenIat,
        };
        foundedSession.updateSession(sessionUpdateData);
        this.authRepository.saveSession(foundedSession);
      } else {
        const newSession: SessionDocument = createNewSession();
        this.authRepository.saveSession(newSession);
      }
    };
    await handleSession();
    return {
      newAccessToken,
      newRefreshToken,
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
    const refreshTokenPayload: JwtRefreshTokenPayloadType | null =
      this.jwtHelpers.verifyRefreshToken(refreshToken);
    if (!refreshTokenPayload) {
      throw new UnauthorizedException();
    }
    const foundedSession: SessionDocument | null =
      await this.SessionModel.findOne({
        userId: refreshTokenPayload.userId,
      });
    if (!foundedSession) {
      throw new UnauthorizedException();
    }
    if (foundedSession.iat !== refreshTokenPayload.iat) {
      throw new UnauthorizedException();
    }
    this.authRepository.deleteSession(refreshTokenPayload.userId);
  }

  async updatePairOfTokens(refreshToken: string): Promise<{
    newAccessToken: string;
    newRefreshToken: string;
  }> {
    const refreshTokenPayload: JwtRefreshTokenPayloadType | null =
      this.jwtHelpers.verifyRefreshToken(refreshToken);
    if (!refreshTokenPayload) {
      throw new UnauthorizedException();
    }
    const foundedSession: SessionDocument | null =
      await this.SessionModel.findOne({
        userId: refreshTokenPayload.userId,
      });
    if (!foundedSession) {
      throw new UnauthorizedException();
    }
    if (refreshTokenPayload.iat !== foundedSession.iat) {
      throw new UnauthorizedException();
    }
    const { newAccessToken, newRefreshToken, newRefreshTokenIat } =
      this.jwtHelpers.createPairOfTokens({
        userId: refreshTokenPayload.userId,
      });
    foundedSession.updateSession({ refreshTokenIat: newRefreshTokenIat });
    this.authRepository.saveSession(foundedSession);
    return {
      newAccessToken,
      newRefreshToken,
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
      this.usersRepository.saveUser(foundedUserByEmail);
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
    this.usersRepository.saveUser(foundedUser);
  }
}
