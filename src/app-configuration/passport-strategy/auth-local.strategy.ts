import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../../auth-module/auth/auth-application/auth.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '../../auth-module/auth-module-domain/user/user.entity';

@Injectable()
export class AuthLocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'loginOrEmail',
      passwordField: 'password',
    });
  }

  async validate(loginOrEmail: string, password: string) {
    const user: User | null = await this.authService.validateUser({
      loginOrEmail,
      password,
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}

export class LocalAuthGuard extends AuthGuard('local') {}
