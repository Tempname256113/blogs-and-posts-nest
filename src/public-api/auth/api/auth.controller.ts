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
import { UserApiCreateDto } from '../../../admin-api/user/api/models/user-api.dto';
import { LocalAuthGuard } from '../../../../libs/auth/passport-strategy/auth-local.strategy';
import { PassportjsReqDataDecorator } from '../../../../generic-decorators/passportjs-req-data.decorator';
import { User } from '../../../../libs/db/mongoose/schemes/user.entity';
import { Response } from 'express';
import { CookiesEnum } from '../../../../generic-enums/cookies.enum';
import {
  AuthApiConfirmRegistrationDTO,
  AuthApiEmailPropertyDTO,
  NewPasswordDTO,
} from './models/auth-api.dto';
import { Cookies } from '../../../../generic-decorators/cookies.decorator';
import { JwtRefreshTokenPayloadType } from '../../../../generic-models/jwt.payload.model';
import { AuthApiUserInfoType } from './models/auth-api.models';
import { UserQueryRepository } from '../../../admin-api/user/infrastructure/repositories/user.query-repository';
import { ClientDeviceTitle } from '../../../../generic-decorators/client-device-title.decorator';
import { JwtAuthRefreshTokenGuard } from '../../../../libs/auth/passport-strategy/auth-jwt-refresh-token.strategy';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AccessToken } from '../../../../generic-decorators/access-token.decorator';
import { CommandBus } from '@nestjs/cqrs';
import { RegistrationUserCommand } from '../application/use-cases/registration-user.use-case';
import { LoginUserCommand } from '../application/use-cases/login-user.use-case';
import { ConfirmRegistrationCommand } from '../application/use-cases/registration-confirm.use-case';
import { ResendConfirmationEmailCommand } from '../application/use-cases/resend-confirmation-email.use-case';
import { LogoutCommand } from '../application/use-cases/logout-user.use-case';
import { UpdateTokensPairCommand } from '../application/use-cases/update-tokens-pair.use-case';
import { SendPasswordRecoveryCodeCommand } from '../application/use-cases/send-password-recovery-code.use-case';
import { SetNewPasswordCommand } from '../application/use-cases/set-new-password.use-case';

@Controller('auth')
export class AuthController {
  constructor(
    private usersQueryRepository: UserQueryRepository,
    private commandBus: CommandBus,
  ) {}
  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  // @UseGuards(ThrottlerGuard)
  async registrationNewUser(
    @Body() createNewUserDTO: UserApiCreateDto,
  ): Promise<void> {
    await this.commandBus.execute<RegistrationUserCommand, void>(
      new RegistrationUserCommand(createNewUserDTO),
    );
  }

  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  // @UseGuards(ThrottlerGuard)
  async confirmRegistration(
    @Body() { code }: AuthApiConfirmRegistrationDTO,
  ): Promise<void> {
    await this.commandBus.execute<ConfirmRegistrationCommand, void>(
      new ConfirmRegistrationCommand(code, 'code'),
    );
  }

  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  // @UseGuards(ThrottlerGuard)
  async emailResending(
    @Body() { email }: AuthApiEmailPropertyDTO,
  ): Promise<void> {
    await this.commandBus.execute<ResendConfirmationEmailCommand, void>(
      new ResendConfirmationEmailCommand(email, 'email'),
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  // @UseGuards(ThrottlerGuard)
  async login(
    @PassportjsReqDataDecorator<User>() reqUser: User,
    @Res({ passthrough: true }) response: Response,
    @Ip() clientIp: string,
    @ClientDeviceTitle() clientDeviceTitle: string,
  ): Promise<{ accessToken: string }> {
    const { newAccessToken, newRefreshToken } = await this.commandBus.execute<
      LoginUserCommand,
      { newAccessToken: string; newRefreshToken: string }
    >(
      new LoginUserCommand({
        user: reqUser,
        clientIpAddress: clientIp,
        clientDeviceTitle: clientDeviceTitle,
      }),
    );
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
    await this.commandBus.execute<LogoutCommand, void>(
      new LogoutCommand(refreshToken),
    );
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthRefreshTokenGuard)
  async updatePairOfTokens(
    @Ip() clientIp: string,
    @ClientDeviceTitle() clientDeviceTitle: string,
    @Res({ passthrough: true }) response: Response,
    @PassportjsReqDataDecorator<JwtRefreshTokenPayloadType>()
    refreshTokenPayload: JwtRefreshTokenPayloadType,
  ): Promise<{ accessToken: string }> {
    const {
      newAccessToken,
      newRefreshToken,
    }: { newAccessToken: string; newRefreshToken: string } =
      await this.commandBus.execute<
        UpdateTokensPairCommand,
        { newAccessToken: string; newRefreshToken: string }
      >(
        new UpdateTokensPairCommand({
          requestRefreshTokenPayload: refreshTokenPayload,
          userIpAddress: clientIp,
          userDeviceTitle: clientDeviceTitle,
        }),
      );
    response.cookie(CookiesEnum.REFRESH_TOKEN_PROPERTY, newRefreshToken, {
      httpOnly: true,
      secure: true,
    });
    return { accessToken: newAccessToken };
  }

  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  // @UseGuards(ThrottlerGuard)
  async passwordRecovery(
    @Body() { email }: AuthApiEmailPropertyDTO,
  ): Promise<void> {
    await this.commandBus.execute<SendPasswordRecoveryCodeCommand, void>(
      new SendPasswordRecoveryCodeCommand(email),
    );
  }

  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  // @UseGuards(ThrottlerGuard)
  async confirmPasswordRecovery(
    @Body() { newPassword, recoveryCode }: NewPasswordDTO,
  ): Promise<void> {
    await this.commandBus.execute(
      new SetNewPasswordCommand({
        newPassword,
        recoveryCode,
        errorField: 'recoveryCode',
      }),
    );
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getInfoAboutUser(
    @AccessToken() accessToken: string | null,
  ): Promise<AuthApiUserInfoType> {
    if (!accessToken) throw new UnauthorizedException();
    const foundedUserInfo: AuthApiUserInfoType | null =
      await this.usersQueryRepository.getInfoAboutUser(accessToken);
    if (!foundedUserInfo) throw new UnauthorizedException();
    return foundedUserInfo;
  }
}
