import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserApiCreateDto } from '../../user/user-api/user-api-models/user-api.dto';
import { AuthService } from '../auth-application/auth.service';
import { Request } from 'express';
import { LocalAuthGuard } from '../../../app-configuration/passport-strategy/auth-local.strategy';

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

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  async login(@Req() req: Request) {
    return req.user;
  }
}
