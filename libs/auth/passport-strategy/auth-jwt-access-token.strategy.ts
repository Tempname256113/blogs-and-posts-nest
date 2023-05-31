import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { EnvConfiguration } from '../../../app-configuration/environment/env-configuration';
import { JwtAccessTokenPayloadType } from '../../../generic-models/jwt.payload.model';

const accessTokenSecret = new EnvConfiguration().JWT_SECRET_ACCESS_TOKEN;

@Injectable()
export class AuthJwtAccessTokenStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: accessTokenSecret,
    });
  }

  validate(
    accessTokenPayload: JwtAccessTokenPayloadType,
  ): JwtAccessTokenPayloadType {
    return accessTokenPayload;
  }
}

/* проверяет валидность access token и время его жизни. если токен валиден и
 * по времени еще актуален то гард пропускает запрос дальше, если нет, то будет ошибка
 * Unauthorized которая отправит на клиент ответ со статусом 401.
 * если все хорошо то к req будет прикреплен объект user с расшифрованным
 * access token payload. получится так req.user = {accessTokenPayload} */
export class JwtAuthAccessTokenGuard extends AuthGuard('jwt') {}
