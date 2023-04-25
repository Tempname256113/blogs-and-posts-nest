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

/*локальная стратегия аутентификации passportjs. проверяет входные данные пользователя и в случае несоответствий
 * выкидывает исключение. также passportjs прикрепляет к объекту запроса в случае успешной аутентификации объект user
 * в котором будет содержаться информация возвращаемая из функции validate. в этой стратегии возвращается объект
 * пользователя из базы данных. то есть после гарда с этой стратегией в запросе можно увидеть пользователя через
 * req.user в случае успешной аутентификации*/
export class LocalAuthGuard extends AuthGuard('local') {}
