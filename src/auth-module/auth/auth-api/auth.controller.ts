import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UserApiCreateDto } from '../../user/user-api/user-api-models/user-api.dto';
import { AuthService } from '../auth-application/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationNewUser(@Body() createNewUserDTO: UserApiCreateDto) {
    await this.authService.registrationNewUser(createNewUserDTO);
  }
}
