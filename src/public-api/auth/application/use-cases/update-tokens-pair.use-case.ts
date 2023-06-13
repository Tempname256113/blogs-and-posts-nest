import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtRefreshTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import {
  CreateNewTokenPairData,
  CreateNewTokenPairReturnType,
  JwtUtils,
} from '../../../../../libs/auth/jwt/jwt-utils.service';
import { SessionUpdateRepositoryDTO } from '../../infrastructure/repositories/models/auth-repository.dto';
import {
  SessionDocument,
  SessionSchema,
} from '../../../../../libs/db/mongoose/schemes/session.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';

export class UpdateTokensPairCommand {
  constructor(
    public readonly data: {
      requestRefreshTokenPayload: JwtRefreshTokenPayloadType;
      userIpAddress: string;
      userDeviceTitle: string;
    },
  ) {}
}

@CommandHandler(UpdateTokensPairCommand)
export class UpdateTokensPairUseCase
  implements
    ICommandHandler<
      UpdateTokensPairCommand,
      { newAccessToken: string; newRefreshToken: string }
    >
{
  constructor(
    @InjectModel(SessionSchema.name) private SessionModel: Model<SessionSchema>,
    private jwtHelpers: JwtUtils,
    private authRepository: AuthRepository,
  ) {}

  async execute({
    data: { requestRefreshTokenPayload, userDeviceTitle, userIpAddress },
  }: UpdateTokensPairCommand): Promise<{
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
    const updateSessionData: SessionUpdateRepositoryDTO = {
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
}
