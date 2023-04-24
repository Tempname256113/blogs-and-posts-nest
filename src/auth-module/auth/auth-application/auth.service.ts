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
import {
  JwtAccessTokenPayloadType,
  JwtRefreshTokenPayloadType,
} from '../../../app-models/jwt.payload.model';
import { JwtService } from '@nestjs/jwt';
import { EnvConfiguration } from '../../../app-configuration/env-configuration';
import {
  Session,
  SessionDocument,
  SessionSchema,
} from '../../auth-module-domain/auth/session.entity';
import { SessionUpdateDTO } from '../auth-infrastructure/auth-repositories/auth-repositories-models/auth-repository.dto';
import { UserRepository } from '../../user/user-infrastructure/user-repositories/user.repository';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    @InjectModel(SessionSchema.name) private SessionModel: Model<SessionSchema>,
    private authRepository: AuthRepository,
    private usersRepository: UserRepository,
    private emailService: AuthEmailAdapterService,
    private jwtService: JwtService,
    private envConfig: EnvConfiguration,
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
    const createRefreshToken = async (): Promise<string> => {
      const currentTimeInSeconds: number = getUnixTime(new Date());
      const refreshTokenExpiresIn: number = getUnixTime(
        add(new Date(), { months: 3 }),
      );
      const refreshTokenSecret: string =
        this.envConfig.JWT_SECRET_REFRESH_TOKEN;
      const refreshTokenPayload: JwtRefreshTokenPayloadType = {
        userId: user.id,
        iat: currentTimeInSeconds,
      };
      const refreshToken: string = this.jwtService.sign(refreshTokenPayload, {
        secret: refreshTokenSecret,
        expiresIn: refreshTokenExpiresIn,
      });
      const sessionHandler = async (): Promise<void> => {
        const newSession: Session = {
          userId: user.id,
          iat: currentTimeInSeconds,
        };
        const newSessionModel: SessionDocument = new this.SessionModel(
          newSession,
        );
        const sessionUpdateData: SessionUpdateDTO = {
          iat: currentTimeInSeconds,
        };
        const checkSessionExistenceAndUpdate: boolean =
          await this.authRepository.updateSession(user.id, sessionUpdateData);
        if (!checkSessionExistenceAndUpdate) {
          this.authRepository.saveSession(newSessionModel);
        }
      };
      sessionHandler();
      return refreshToken;
    };
    const createAccessToken = (): string => {
      const accessTokenExpiresIn: number = getUnixTime(
        add(new Date(), { minutes: 15 }),
      );
      const accessTokenSecret: string = this.envConfig.JWT_SECRET_ACCESS_TOKEN;
      const accessTokenPayload: JwtAccessTokenPayloadType = {
        userId: user.id,
      };
      const accessToken = this.jwtService.sign(accessTokenPayload, {
        secret: accessTokenSecret,
        expiresIn: accessTokenExpiresIn,
      });
      return accessToken;
    };
    const accessToken = createAccessToken();
    const refreshToken = await createRefreshToken();
    return {
      accessToken,
      refreshToken,
    };
  }

  async confirmRegistration(confirmationCode: string): Promise<void> {
    const foundedUserByConfirmationCode: UserDocument | null =
      await this.UserModel.findOne({
        'emailConfirmation.confirmationCode': confirmationCode,
      });
    if (!foundedUserByConfirmationCode) {
      throw new BadRequestException();
    } else if (!foundedUserByConfirmationCode.confirmRegistration()) {
      throw new BadRequestException();
    }
    const modifiedProperties: string[] =
      foundedUserByConfirmationCode.getPossibleModifiedProperties();
    modifiedProperties.forEach((modifiedProperty) => {
      foundedUserByConfirmationCode.markModified(modifiedProperty);
    });
    await this.usersRepository.saveUser(foundedUserByConfirmationCode);
  }
}
