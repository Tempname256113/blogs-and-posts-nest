import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthRefreshTokenGuard } from '../../../../libs/auth/passport-strategy/auth-jwt-refresh-token.strategy';
import { PassportjsReqDataDecorator } from '../../../../generic-decorators/passportjs-req-data.decorator';
import { JwtRefreshTokenPayloadType } from '../../../../generic-models/jwt.payload.model';
import { SessionSecurityViewModel } from './models/security-api.models';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteAllSessionsExceptCurrentCommand } from '../application/use-cases/delete-all-sessions-except-current.use-case';
import { DeleteSessionByDeviceIdCommand } from '../application/use-cases/delete-session-by-deviceId.use-case';
import { SecurityQueryRepositorySQL } from '../infrastructure/repositories/security.query-repository-sql';

@Controller('security')
export class SecurityController {
  constructor(
    private readonly securityQueryRepositorySQL: SecurityQueryRepositorySQL,
    private commandBus: CommandBus,
  ) {}
  @Get('devices')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthRefreshTokenGuard)
  async getAllActiveSessions(
    @PassportjsReqDataDecorator<JwtRefreshTokenPayloadType>()
    refreshTokenPayload: JwtRefreshTokenPayloadType,
  ): Promise<SessionSecurityViewModel[]> {
    const sessionArray: SessionSecurityViewModel[] =
      await this.securityQueryRepositorySQL.getAllActiveSessions(
        refreshTokenPayload,
      );
    return sessionArray;
  }

  @Delete('devices')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthRefreshTokenGuard)
  async deleteAllSessionsExcludeCurrent(
    @PassportjsReqDataDecorator<JwtRefreshTokenPayloadType>()
    refreshTokenPayload: JwtRefreshTokenPayloadType,
  ): Promise<void> {
    await this.commandBus.execute<DeleteAllSessionsExceptCurrentCommand, void>(
      new DeleteAllSessionsExceptCurrentCommand(refreshTokenPayload),
    );
  }

  @Delete('devices/:deviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthRefreshTokenGuard)
  async deleteSessionByDeviceId(
    @PassportjsReqDataDecorator<JwtRefreshTokenPayloadType>()
    refreshTokenPayload: JwtRefreshTokenPayloadType,
    @Param('deviceId') deviceId: number,
  ): Promise<void> {
    await this.commandBus.execute<DeleteSessionByDeviceIdCommand, void>(
      new DeleteSessionByDeviceIdCommand({ deviceId, refreshTokenPayload }),
    );
  }
}
