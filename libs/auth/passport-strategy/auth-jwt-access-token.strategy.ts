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

export class JwtAuthAccessTokenGuard extends AuthGuard('jwt') {}
