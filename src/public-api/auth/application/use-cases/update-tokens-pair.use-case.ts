import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtRefreshTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import {
  CreateNewTokensPairReturnType,
  JwtUtils,
} from '../../../../../libs/auth/jwt/jwt-utils.service';
import { randomUUID } from 'crypto';
import { AuthRepositorySQL } from '../../infrastructure/repositories/auth.repository-sql';

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
    private jwtUtils: JwtUtils,
    private authRepositorySQL: AuthRepositorySQL,
  ) {}

  async execute({
    data: { requestRefreshTokenPayload, userDeviceTitle, userIpAddress },
  }: UpdateTokensPairCommand): Promise<{
    newAccessToken: string;
    newRefreshToken: string;
  }> {
    const uniqueKey: string = randomUUID();
    await this.authRepositorySQL.updateSession({
      deviceId: requestRefreshTokenPayload.deviceId,
      uniqueKey,
      userIpAddress,
      userDeviceTitle,
    });
    const newTokensPair: CreateNewTokensPairReturnType =
      this.jwtUtils.createNewTokensPair({
        userId: requestRefreshTokenPayload.userId,
        userLogin: requestRefreshTokenPayload.userLogin,
        deviceId: requestRefreshTokenPayload.deviceId,
        uniqueKey,
      });
    return {
      newAccessToken: newTokensPair.newAccessToken,
      newRefreshToken: newTokensPair.newRefreshToken,
    };
  }
}
