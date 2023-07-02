import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EnvConfiguration } from '../../../app-configuration/environment/env-configuration';
import { JwtRefreshTokenPayloadType } from '../../../generic-models/jwt.payload.model';
import { Request } from 'express';
import { CookiesEnum } from '../../../generic-enums/cookies.enum';
import { AuthQueryRepositorySQL } from '../../../src/public-api/auth/infrastructure/repositories/auth.query-repository-sql';
import { SessionRepositoryType } from '../../../src/public-api/auth/infrastructure/repositories/models/auth-repository.dto';

const refreshTokenSecret = new EnvConfiguration().JWT_SECRET_REFRESH_TOKEN;

const extractRefreshTokenFromCookie = (req: Request): string => {
  const reqRefreshToken: string | undefined =
    req.cookies?.[CookiesEnum.REFRESH_TOKEN_PROPERTY];
  if (!reqRefreshToken) {
    return null;
  }
  return reqRefreshToken;
};

@Injectable()
export class AuthJwtRefreshTokenStrategy extends PassportStrategy(Strategy) {
  constructor(private authQueryRepository: AuthQueryRepositorySQL) {
    super({
      jwtFromRequest: extractRefreshTokenFromCookie,
      ignoreExpiration: false,
      secretOrKey: refreshTokenSecret,
    });
  }

  async validate(
    reqRefreshTokenPayload: JwtRefreshTokenPayloadType,
  ): Promise<JwtRefreshTokenPayloadType> {
    const foundedSessionFromDB: SessionRepositoryType =
      await this.authQueryRepository.getSessionByDeviceId(
        reqRefreshTokenPayload.deviceId,
      );
    if (!foundedSessionFromDB) {
      throw new UnauthorizedException();
    }
    if (reqRefreshTokenPayload.uniqueKey !== foundedSessionFromDB.uniqueKey) {
      throw new UnauthorizedException();
    }
    return reqRefreshTokenPayload;
  }
}

/* guard расшифровывает refresh token из cookies и проверяет его валидность, срок жизни
 * и сравнивает версии пришедшего с запросом токена и токена с таким же deivceId из базы данных
 * если все верно, то guard пропускает запрос дальше контроллеру и прикрепляет
 * к объекту запроса свой объект user, то есть получается req.user
 * в req.user будет содержимое правильного расшифрованного токена refresh token payload
 *  или выкинет исключение unauthorized если токена нет/истекло время жизни/или не одинаковые версии */
export class JwtAuthRefreshTokenGuard extends AuthGuard('jwt') {}
