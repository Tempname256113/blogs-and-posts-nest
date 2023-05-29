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
import { AdditionalReqDataDecorator } from '../../../../generic-decorators/additional-req-data.decorator';
import { JwtRefreshTokenPayloadType } from '../../../../generic-models/jwt.payload.model';
import { SessionSecurityApiModel } from './models/security-api.models';
import { SecurityQueryRepository } from '../infrastructure/repositories/security.query-repository';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteAllSessionsExceptCurrentCommand } from '../application/use-cases/delete-all-sessions.use-case';
import { DeleteSessionByDeviceIdCommand } from '../application/use-cases/delete-session-by-deviceId.use-case';

@Controller('security')
export class SecurityController {
  constructor(
    private securityQueryRepository: SecurityQueryRepository,
    private commandBus: CommandBus,
  ) {}
  @Get('devices')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthRefreshTokenGuard)
  async getAllActiveSessions(
    @AdditionalReqDataDecorator<JwtRefreshTokenPayloadType>()
    refreshTokenPayload: JwtRefreshTokenPayloadType,
  ): Promise<SessionSecurityApiModel[]> {
    const sessionArray: SessionSecurityApiModel[] =
      await this.securityQueryRepository.getAllActiveSessions(
        refreshTokenPayload,
      );
    return sessionArray;
  }

  @Delete('devices')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthRefreshTokenGuard)
  async deleteAllSessionsExcludeCurrent(
    @AdditionalReqDataDecorator<JwtRefreshTokenPayloadType>()
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
    @AdditionalReqDataDecorator<JwtRefreshTokenPayloadType>()
    refreshTokenPayload: JwtRefreshTokenPayloadType,
    @Param('deviceId') deviceId: string,
  ): Promise<void> {
    await this.commandBus.execute<DeleteSessionByDeviceIdCommand, void>(
      new DeleteSessionByDeviceIdCommand({ deviceId, refreshTokenPayload }),
    );
  }
}
