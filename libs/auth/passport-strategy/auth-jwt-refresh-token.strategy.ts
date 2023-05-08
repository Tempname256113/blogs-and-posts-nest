import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EnvConfiguration } from '../../../app-configuration/environment/env-configuration';
import { JwtRefreshTokenPayloadType } from '../../../generic-models/jwt.payload.model';
import {
  Session,
  SessionSchema,
} from '../../db/mongoose/schemes/session.entity';
import { Request } from 'express';
import { CookiesEnum } from '../../../generic-enums/cookies.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

const refreshTokenSecret = new EnvConfiguration().JWT_SECRET_REFRESH_TOKEN;

const extractRefreshTokenFromCookie = (req: Request) => {
  const reqRefreshToken: string | undefined =
    req.cookies?.[CookiesEnum.REFRESH_TOKEN_PROPERTY];
  if (!reqRefreshToken) {
    return null;
  }
  return reqRefreshToken;
};

@Injectable()
export class AuthJwtRefreshTokenStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(SessionSchema.name) private SessionModel: Model<SessionSchema>,
  ) {
    super({
      jwtFromRequest: extractRefreshTokenFromCookie,
      ignoreExpiration: false,
      secretOrKey: refreshTokenSecret,
    });
  }

  async validate(
    reqRefreshTokenPayload: JwtRefreshTokenPayloadType,
  ): Promise<JwtRefreshTokenPayloadType> {
    const foundedSessionFromDB: Session | null =
      await this.SessionModel.findOne({
        deviceId: reqRefreshTokenPayload.deviceId,
      }).lean();
    if (!foundedSessionFromDB) {
      throw new UnauthorizedException();
    }
    if (reqRefreshTokenPayload.iat !== foundedSessionFromDB.iat) {
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
