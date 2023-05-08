import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserApiCreateDto } from '../../../user/user-api/user-api-models/user-api.dto';
import { AuthService } from '../../auth-application/auth.service';
import { LocalAuthGuard } from '../../../../../libs/auth/passport-strategy/auth-local.strategy';
import { AdditionalReqDataDecorator } from '../../../../../generic-decorators/additional-req-data.decorator';
import { User } from '../../../../../libs/db/mongoose/schemes/user.entity';
import { Response } from 'express';
import { CookiesEnum } from '../../../../../generic-enums/cookies.enum';
import {
  AuthApiConfirmRegistrationDTO,
  AuthApiEmailPropertyDTO,
  NewPasswordDTO,
} from '../auth-api-models/auth-api.dto';
import { Cookies } from '../../../../../generic-decorators/cookies.decorator';
import { JwtAuthGuard } from '../../../../../libs/auth/passport-strategy/auth-jwt.strategy';
import {
  JwtAccessTokenPayloadType,
  JwtRefreshTokenPayloadType,
} from '../../../../../generic-models/jwt.payload.model';
import { AuthApiUserInfoModelType } from '../auth-api-models/auth-api.models';
import { UserQueryRepository } from '../../../user/user-infrastructure/user-repositories/user.query-repository';
import { ClientDeviceTitle } from '../../../../../generic-decorators/client-device-title.decorator';
import { JwtAuthRefreshTokenGuard } from '../../../../../libs/auth/passport-strategy/auth-jwt-refresh-token.strategy';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersQueryRepository: UserQueryRepository,
  ) {}
  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(ThrottlerGuard)
  async registrationNewUser(
    @Body() createNewUserDTO: UserApiCreateDto,
  ): Promise<void> {
    await this.authService.registrationNewUser(createNewUserDTO);
  }

  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(ThrottlerGuard)
  async confirmRegistration(
    @Body() { code }: AuthApiConfirmRegistrationDTO,
  ): Promise<void> {
    await this.authService.confirmRegistration(code, 'code');
  }

  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(ThrottlerGuard)
  async emailResending(
    @Body() { email }: AuthApiEmailPropertyDTO,
  ): Promise<void> {
    await this.authService.emailResending(email, 'email');
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @UseGuards(ThrottlerGuard)
  async login(
    @AdditionalReqDataDecorator<User>() reqUser: User,
    @Res({ passthrough: true }) response: Response,
    @Ip() clientIp: string,
    @ClientDeviceTitle() clientDeviceTitle: string,
  ): Promise<{ accessToken: string }> {
    const { newAccessToken, newRefreshToken } = await this.authService.login({
      user: reqUser,
      clientIpAddress: clientIp,
      clientDeviceTitle,
    });
    response.cookie(CookiesEnum.REFRESH_TOKEN_PROPERTY, newRefreshToken, {
      httpOnly: true,
      secure: true,
    });
    return { accessToken: newAccessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Cookies(CookiesEnum.REFRESH_TOKEN_PROPERTY)
    refreshToken: string | undefined,
  ): Promise<void> {
    if (!refreshToken) {
      throw new UnauthorizedException();
    }
    await this.authService.logout(refreshToken);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthRefreshTokenGuard)
  async updatePairOfTokens(
    @Ip() clientIp: string,
    @ClientDeviceTitle() clientDeviceTitle: string,
    @Res({ passthrough: true }) response: Response,
    @AdditionalReqDataDecorator<JwtRefreshTokenPayloadType>()
    refreshTokenPayload: JwtRefreshTokenPayloadType,
  ): Promise<{ accessToken: string }> {
    const {
      newAccessToken,
      newRefreshToken,
    }: { newAccessToken: string; newRefreshToken: string } =
      await this.authService.updatePairOfTokens({
        refreshTokenPayload: refreshTokenPayload,
        userIpAddress: clientIp,
        userDeviceTitle: clientDeviceTitle,
      });
    response.cookie(CookiesEnum.REFRESH_TOKEN_PROPERTY, newRefreshToken, {
      httpOnly: true,
      secure: false,
    });
    return { accessToken: newAccessToken };
  }

  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(ThrottlerGuard)
  async passwordRecovery(
    @Body() { email }: AuthApiEmailPropertyDTO,
  ): Promise<void> {
    await this.authService.sendPasswordRecoveryCode(email);
  }

  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(ThrottlerGuard)
  async confirmPasswordRecovery(
    @Body() { newPassword, recoveryCode }: NewPasswordDTO,
  ): Promise<void> {
    await this.authService.setNewUserPassword({
      newPassword,
      recoveryCode,
      errorField: 'recoveryCode',
    });
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getInfoAboutUser(
    @AdditionalReqDataDecorator<JwtAccessTokenPayloadType>()
    accessTokenPayload: JwtAccessTokenPayloadType,
  ): Promise<AuthApiUserInfoModelType> {
    const foundedUserInfo: AuthApiUserInfoModelType | null =
      await this.usersQueryRepository.getInfoAboutUser(
        accessTokenPayload.userId,
      );
    if (!foundedUserInfo) throw new UnauthorizedException();
    return foundedUserInfo;
  }
}
