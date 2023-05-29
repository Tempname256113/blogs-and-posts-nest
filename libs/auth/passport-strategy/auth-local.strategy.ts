import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '../../db/mongoose/schemes/user.entity';
import { CommandBus } from '@nestjs/cqrs';
import { ValidateUserCommand } from '../../../src/public-api/auth/application/use-cases/validate-user.use-case';

@Injectable()
export class AuthLocalStrategy extends PassportStrategy(Strategy) {
  constructor(private commandBus: CommandBus) {
    super({
      usernameField: 'loginOrEmail',
      passwordField: 'password',
    });
  }

  async validate(loginOrEmail: string, password: string) {
    const user: User | null = await this.commandBus.execute(
      new ValidateUserCommand({ loginOrEmail, password }),
    );
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
