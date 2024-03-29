import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtRefreshTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { UnauthorizedException } from '@nestjs/common';
import { SessionRepositoryType } from '../../infrastructure/repositories/models/auth-repository.dto';
import { AuthRepositorySQL } from '../../infrastructure/repositories/auth.repository-sql';
import { AuthQueryRepositorySQL } from '../../infrastructure/repositories/auth.query-repository-sql';

export class LogoutCommand {
  constructor(
    public readonly refreshTokenPayload: JwtRefreshTokenPayloadType,
  ) {}
}

@CommandHandler(LogoutCommand)
export class LogoutUserUseCase implements ICommandHandler<LogoutCommand, void> {
  constructor(
    private readonly authRepositorySQL: AuthRepositorySQL,
    private readonly authQueryRepositorySQL: AuthQueryRepositorySQL,
  ) {}
  async execute({ refreshTokenPayload }: LogoutCommand): Promise<void> {
    const foundedSessionFromDB: SessionRepositoryType | null =
      await this.authQueryRepositorySQL.getSessionByDeviceId(
        Number(refreshTokenPayload.deviceId),
      );
    if (
      !foundedSessionFromDB ||
      foundedSessionFromDB.uniqueKey !== refreshTokenPayload.uniqueKey
    ) {
      throw new UnauthorizedException();
    }
    await this.authRepositorySQL.deleteSessionByDeviceId(
      Number(refreshTokenPayload.deviceId),
    );
  }
}
