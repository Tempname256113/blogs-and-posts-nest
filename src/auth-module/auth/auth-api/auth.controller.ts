import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserApiCreateDto } from '../../user/user-api/user-api-models/user-api.dto';
import { AuthService } from '../auth-application/auth.service';
import { LocalAuthGuard } from '../../../app-helpers/passport-strategy/auth-local.strategy';
import { AdditionalReqDataDecorator } from '../../../app-helpers/decorators/additional-req-data.decorator';
import { User } from '../../auth-module-domain/user/user.entity';
import { Response } from 'express';
import { CookiesEnum } from '../../../app-helpers/enums/cookies.enum';
import {
  AuthApiConfirmRegistrationDTO,
  AuthApiEmailPropertyDTO,
  NewPasswordDTO,
} from './auth-api-models/auth-api.dto';
import { Cookies } from '../../../app-helpers/decorators/cookies.decorator';
import { JwtAuthGuard } from '../../../app-helpers/passport-strategy/auth-jwt.strategy';
import { JwtAccessTokenPayloadType } from '../../../app-models/jwt.payload.model';
import { AuthApiUserInfoModelType } from './auth-api-models/auth-api.models';
import { UserQueryRepository } from '../../user/user-infrastructure/user-repositories/user.query-repository';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersQueryRepository: UserQueryRepository,
  ) {}
  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationNewUser(
    @Body() createNewUserDTO: UserApiCreateDto,
  ): Promise<void> {
    await this.authService.registrationNewUser(createNewUserDTO);
  }

  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmRegistration(
    @Body() { code }: AuthApiConfirmRegistrationDTO,
  ): Promise<void> {
    await this.authService.confirmRegistration(code, 'code');
  }

  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async emailResending(
    @Body() { email }: AuthApiEmailPropertyDTO,
  ): Promise<void> {
    await this.authService.emailResending(email, 'email');
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  async login(
    @AdditionalReqDataDecorator<User>() reqUser: User,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string }> {
    const { newAccessToken, newRefreshToken } = await this.authService.login(
      reqUser,
    );
    response.cookie(CookiesEnum.REFRESH_TOKEN_PROPERTY, newRefreshToken, {
      httpOnly: true,
      secure: false,
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
  async updatePairOfTokens(
    @Cookies(CookiesEnum.REFRESH_TOKEN_PROPERTY)
    refreshToken: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string }> {
    if (!refreshToken) {
      throw new UnauthorizedException();
    }
    const {
      newAccessToken,
      newRefreshToken,
    }: { newAccessToken: string; newRefreshToken: string } =
      await this.authService.updatePairOfTokens(refreshToken);
    response.cookie(CookiesEnum.REFRESH_TOKEN_PROPERTY, newRefreshToken, {
      httpOnly: true,
      secure: false,
    });
    return { accessToken: newAccessToken };
  }

  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(
    @Body() { email }: AuthApiEmailPropertyDTO,
  ): Promise<void> {
    await this.authService.sendPasswordRecoveryCode(email);
  }

  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
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
    const foundedUser: AuthApiUserInfoModelType | null =
      await this.usersQueryRepository.getInfoAboutUser(
        accessTokenPayload.userId,
      );
    if (!foundedUser) throw new UnauthorizedException();
    return foundedUser;
  }
}
