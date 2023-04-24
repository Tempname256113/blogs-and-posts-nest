import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { BasicStrategy as Strategy } from 'passport-http';
import { EnvConfiguration } from '../env-configuration';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthBasicStrategy extends PassportStrategy(Strategy, 'basic') {
  constructor(private envConfiguration: EnvConfiguration) {
    super();
  }

  public async validate(username: string, password: string): Promise<boolean> {
    if (
      this.envConfiguration.BASIC_AUTH_LOGIN === username &&
      this.envConfiguration.BASIC_AUTH_PASSWORD === password
    ) {
      return true;
    }
    throw new UnauthorizedException();
  }
}

export class BasicAuthGuard extends AuthGuard('basic') {}
