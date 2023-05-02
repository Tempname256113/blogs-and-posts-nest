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
    this.refreshTokenExpiresIn = { seconds: 20 };
    this.accessTokenExpiresIn = { seconds: 10 };
    this.refreshTokenSecret = this.envConfig.JWT_SECRET_REFRESH_TOKEN;
    this.accessTokenSecret = this.envConfig.JWT_SECRET_ACCESS_TOKEN;
  }

  createRefreshToken({
    userId,
    userLogin,
  }: {
    userId: string;
    userLogin: string;
  }): {
    refreshToken: string;
    refreshTokenIat: number;
  } {
    const refreshTokenIat: number = getUnixTime(new Date());
    const refreshTokenExpiresIn: number = getUnixTime(
      add(new Date(), this.refreshTokenExpiresIn),
    );
    const refreshTokenPayload: JwtRefreshTokenPayloadType = {
      userId,
      userLogin,
      iat: refreshTokenIat,
    };
    const refreshToken: string = this.jwtService.sign(refreshTokenPayload, {
      secret: this.refreshTokenSecret,
      expiresIn: refreshTokenExpiresIn,
    });
    return { refreshToken, refreshTokenIat };
  }

  createAccessToken({
    userId,
    userLogin,
  }: {
    userId: string;
    userLogin: string;
  }): string {
    const accessTokenExpiresIn: number = getUnixTime(
      add(new Date(), this.accessTokenExpiresIn),
    );
    const accessTokenPayload: JwtAccessTokenPayloadType = {
      userId,
      userLogin,
    };
    const accessToken = this.jwtService.sign(accessTokenPayload, {
      secret: this.accessTokenSecret,
      expiresIn: accessTokenExpiresIn,
    });
    return accessToken;
  }

  createPairOfTokens({
    userId,
    userLogin,
  }: {
    userId: string;
    userLogin: string;
  }): {
    newAccessToken: string;
    newRefreshToken: string;
    newRefreshTokenIat: number;
  } {
    const { refreshToken, refreshTokenIat } = this.createRefreshToken({
      userId,
      userLogin,
    });
    return {
      newAccessToken: this.createAccessToken({ userId, userLogin }),
      newRefreshToken: refreshToken,
      newRefreshTokenIat: refreshTokenIat,
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

  /* расшифровывает access token и в случае успеха возвращает payload of access token
   * в случае ошибки возвращает null */
  verifyAccessToken(accessToken: string): JwtAccessTokenPayloadType | null {
    try {
      const accessTokenPayload: JwtAccessTokenPayloadType =
        this.jwtService.verify(accessToken, {
          secret: this.accessTokenSecret,
        });
      return accessTokenPayload;
    } catch (error) {
      return null;
    }
  }
}
