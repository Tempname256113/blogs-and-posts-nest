import { add, getUnixTime } from 'date-fns';
import { Injectable } from '@nestjs/common';
import { EnvConfiguration } from '../../app-configuration/environment/env-configuration';
import { JwtService } from '@nestjs/jwt';
import {
  JwtAccessTokenPayloadType,
  JwtRefreshTokenPayloadType,
} from '../../app-models/jwt.payload.model';

@Injectable()
export class JwtHelpers {
  private readonly refreshTokenSecret: string;
  private readonly accessTokenSecret: string;
  private readonly refreshTokenExpiresIn: Duration;
  private readonly accessTokenExpiresIn: Duration;
  constructor(
    private envConfig: EnvConfiguration,
    private jwtService: JwtService,
  ) {
    this.refreshTokenExpiresIn = { months: 3 };
    this.accessTokenExpiresIn = { minutes: 15 };
    this.refreshTokenSecret = this.envConfig.JWT_SECRET_REFRESH_TOKEN;
    this.accessTokenSecret = this.envConfig.JWT_SECRET_ACCESS_TOKEN;
  }

  createRefreshToken(userId: string): {
    refreshToken: string;
    refreshTokenIat: number;
  } {
    const refreshTokenIat: number = getUnixTime(new Date());
    const refreshTokenExpiresIn: number = getUnixTime(
      add(new Date(), this.refreshTokenExpiresIn),
    );
    const refreshTokenPayload: JwtRefreshTokenPayloadType = {
      userId: userId,
      iat: refreshTokenIat,
    };
    const refreshToken: string = this.jwtService.sign(refreshTokenPayload, {
      secret: this.refreshTokenSecret,
      expiresIn: refreshTokenExpiresIn,
    });
    return { refreshToken, refreshTokenIat };
  }

  createAccessToken(userId: string): string {
    const accessTokenExpiresIn: number = getUnixTime(
      add(new Date(), this.accessTokenExpiresIn),
    );
    const accessTokenPayload: JwtAccessTokenPayloadType = {
      userId: userId,
    };
    const accessToken = this.jwtService.sign(accessTokenPayload, {
      secret: this.accessTokenSecret,
      expiresIn: accessTokenExpiresIn,
    });
    return accessToken;
  }

  createPairOfTokens(tokensData: { userId: string }): {
    accessToken: string;
    refreshToken: string;
    refreshTokenIat: number;
  } {
    const { refreshToken, refreshTokenIat } = this.createRefreshToken(
      tokensData.userId,
    );
    return {
      accessToken: this.createAccessToken(tokensData.userId),
      refreshToken,
      refreshTokenIat,
    };
  }

  verifyRefreshToken(refreshToken: string): JwtRefreshTokenPayloadType | null {
    try {
      const refreshTokenPayload: JwtRefreshTokenPayloadType =
        this.jwtService.verify(refreshToken, {
          secret: this.refreshTokenSecret,
        });
      return refreshTokenPayload;
    } catch (error) {
      return null;
    }
  }
}
