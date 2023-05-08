import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SecurityService } from '../security-application/security.service';
import { JwtAuthRefreshTokenGuard } from '../../../../libs/auth/passport-strategy/auth-jwt-refresh-token.strategy';
import { AdditionalReqDataDecorator } from '../../../../generic-decorators/additional-req-data.decorator';
import { JwtRefreshTokenPayloadType } from '../../../../generic-models/jwt.payload.model';
import { SessionSecurityApiModel } from './security-api-models/security-api.models';
import { SecurityQueryRepository } from '../security-infrastructure/security-repositories/security.query-repository';

@Controller('security')
export class SecurityController {
  constructor(
    private securityService: SecurityService,
    private securityQueryRepository: SecurityQueryRepository,
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
    await this.securityService.deleteAllSessionsExcludeCurrent(
      refreshTokenPayload,
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
    await this.securityService.deleteSessionByDeviceId({
      deviceId,
      refreshTokenPayload,
    });
  }
}
