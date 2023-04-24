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
    @Body('code') confirmationCode: string,
  ): Promise<void> {
    await this.authService.confirmRegistration(confirmationCode);
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
