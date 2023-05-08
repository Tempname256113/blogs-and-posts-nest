import { add, getUnixTime } from 'date-fns';
import { Injectable } from '@nestjs/common';
import { EnvConfiguration } from '../../../app-configuration/environment/env-configuration';
import { JwtService } from '@nestjs/jwt';
import {
  JwtAccessTokenPayloadType,
  JwtRefreshTokenPayloadType,
} from '../../../generic-models/jwt.payload.model';
import { v4 as uuidv4 } from 'uuid';

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
    deviceId: refreshTokenDeviceId = uuidv4(),
  }: {
    userId: string;
    userLogin: string;
    deviceId?: string;
  }): CreateRefreshTokenReturnType {
    const dateNow: Date = new Date();
    const refreshTokenIat: number = getUnixTime(dateNow);
    const refreshTokenExpiresIn: number = getUnixTime(
      add(dateNow, this.refreshTokenExpiresIn),
    );
    const refreshTokenActiveDate: string = dateNow.toISOString();
    const refreshTokenPayload: JwtRefreshTokenPayloadType = {
      userId,
      deviceId: refreshTokenDeviceId,
      userLogin,
      iat: refreshTokenIat,
    };
    const refreshToken: string = this.jwtService.sign(refreshTokenPayload, {
      secret: this.refreshTokenSecret,
      expiresIn: refreshTokenExpiresIn,
    });
    return {
      refreshToken,
      refreshTokenIat,
      refreshTokenDeviceId,
      refreshTokenActiveDate,
    };
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

  createNewTokenPair({
    userId,
    userLogin,
    deviceId = uuidv4(),
  }: CreateNewTokenPairData): CreateNewTokenPairReturnType {
    const {
      refreshToken,
      refreshTokenIat,
      refreshTokenDeviceId,
      refreshTokenActiveDate,
    }: CreateRefreshTokenReturnType = this.createRefreshToken({
      userId,
      userLogin,
      deviceId,
    });
    return {
      newAccessToken: this.createAccessToken({ userId, userLogin }),
      newRefreshToken: {
        refreshToken,
        deviceId: refreshTokenDeviceId,
        iat: refreshTokenIat,
        activeDate: refreshTokenActiveDate,
      },
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

export type CreateNewTokenPairReturnType = {
  newAccessToken: string;
  newRefreshToken: {
    refreshToken: string;
    iat: number;
    deviceId: string;
    activeDate: string;
  };
};

export type CreateRefreshTokenReturnType = {
  refreshToken: string;
  refreshTokenIat: number;
  refreshTokenDeviceId: string;
  refreshTokenActiveDate: string;
};

export type CreateNewTokenPairData = {
  userId: string;
  userLogin: string;
  deviceId?: string;
};
