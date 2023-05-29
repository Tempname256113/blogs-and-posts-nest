import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { User } from '../../../../../libs/db/mongoose/schemes/user.entity';
import {
  Session,
  SessionDocument,
  SessionSchema,
} from '../../../../../libs/db/mongoose/schemes/session.entity';
import {
  CreateNewTokenPairReturnType,
  JwtHelpers,
} from '../../../../../libs/auth/jwt/jwt-helpers.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthRepository } from '../../infrastructure/auth.repository';

export class LoginUserCommand {
  constructor(
    public readonly data: {
      user: User;
      clientIpAddress: string;
      clientDeviceTitle: string;
    },
  ) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase
  implements
    ICommandHandler<
      LoginUserCommand,
      { newAccessToken: string; newRefreshToken: string }
    >
{
  constructor(
    @InjectModel(SessionSchema.name) private SessionModel: Model<SessionSchema>,
    private jwtHelpers: JwtHelpers,
    private authRepository: AuthRepository,
  ) {}

  async execute({
    data: { user, clientIpAddress, clientDeviceTitle },
  }: LoginUserCommand): Promise<{
    newAccessToken: string;
    newRefreshToken: string;
  }> {
    const { newRefreshToken, newAccessToken } = this.createNewTokensPair(user);
    const newCreatedSession: SessionDocument = this.createNewSession({
      user,
      newRefreshToken,
      clientIpAddress,
      clientDeviceTitle,
    });
    await this.authRepository.saveSession(newCreatedSession);
    return {
      newAccessToken,
      newRefreshToken: newRefreshToken.refreshToken,
    };
  }

  createNewSession({
    user,
    newRefreshToken,
    clientIpAddress,
    clientDeviceTitle,
  }: {
    user: User;
    newRefreshToken: {
      refreshToken: string;
      iat: number;
      deviceId: string;
      activeDate: string;
    };
    clientIpAddress: string;
    clientDeviceTitle: string;
  }): SessionDocument {
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
  }

  createNewTokensPair(user: User): CreateNewTokenPairReturnType {
    return this.jwtHelpers.createNewTokenPair({
      userId: user.id,
      userLogin: user.accountData.login,
    });
  }
}
