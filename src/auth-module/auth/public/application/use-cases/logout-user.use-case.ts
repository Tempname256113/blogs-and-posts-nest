import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtRefreshTokenPayloadType } from '../../../../../../generic-models/jwt.payload.model';
import { UnauthorizedException } from '@nestjs/common';
import {
  SessionDocument,
  SessionSchema,
} from '../../../../../../libs/db/mongoose/schemes/session.entity';
import { JwtHelpers } from '../../../../../../libs/auth/jwt/jwt-helpers.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthRepository } from '../../infrastructure/auth.repository';

export class LogoutCommand {
  constructor(public readonly refreshToken: string) {}
}

@CommandHandler(LogoutCommand)
export class LogoutUserUseCase implements ICommandHandler<LogoutCommand, void> {
  constructor(
    @InjectModel(SessionSchema.name) private SessionModel: Model<SessionSchema>,
    private jwtHelpers: JwtHelpers,
    private authRepository: AuthRepository,
  ) {}
  async execute({ refreshToken }: LogoutCommand): Promise<void> {
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
}
