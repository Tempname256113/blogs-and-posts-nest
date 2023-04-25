import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserApiCreateDto } from '../../user/user-api/user-api-models/user-api.dto';
import { AuthService } from '../auth-application/auth.service';
import { LocalAuthGuard } from '../../../app-configuration/passport-strategy/auth-local.strategy';
import { AdditionalReqDataDecorator } from '../../../app-configuration/decorators/additional-req-data.decorator';
import { User } from '../../auth-module-domain/user/user.entity';
import { Response } from 'express';
import { CookiesEnum } from '../../../app-configuration/enums/cookies.enum';
import {
  AuthApiConfirmRegistrationDTO,
  AuthApiEmailResendingDTO,
} from './auth-api-models/auth-api.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
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
    @Body() { email }: AuthApiEmailResendingDTO,
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
    const { accessToken, refreshToken } = await this.authService.login(reqUser);
    response.cookie(CookiesEnum.REFRESH_TOKEN_PROPERTY, refreshToken);
    return { accessToken };
  }
}
