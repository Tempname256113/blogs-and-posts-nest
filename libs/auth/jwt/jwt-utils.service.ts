import { add, getUnixTime } from 'date-fns';
import { Injectable } from '@nestjs/common';
import { EnvConfiguration } from '../../../app-configuration/environment/env-configuration';
import { JwtService } from '@nestjs/jwt';
import {
  JwtAccessTokenPayloadType,
  JwtRefreshTokenPayloadType,
} from '../../../generic-models/jwt.payload.model';

@Injectable()
export class JwtUtils {
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
    deviceId: refreshTokenDeviceId,
    uniqueKey,
  }: CreateNewTokensPairData): string {
    const dateNow: Date = new Date();
    const refreshTokenExpiresIn: number = getUnixTime(
      add(dateNow, this.refreshTokenExpiresIn),
    );
    const refreshTokenPayload: JwtRefreshTokenPayloadType = {
      userId,
      deviceId: refreshTokenDeviceId,
      uniqueKey,
      userLogin,
      exp: refreshTokenExpiresIn,
    };
    const refreshToken: string = this.jwtService.sign(refreshTokenPayload, {
      secret: this.refreshTokenSecret,
    });
    return refreshToken;
  }

  createAccessToken({
    userId,
    userLogin,
  }: {
    userId: string;
    userLogin: string;
  }): string {
    const accessTokenExpiresIn: number = getUnixTime(
      add(new Date(), this.accessTokenExpiresIn).getTime(),
    );
    const accessTokenPayload: JwtAccessTokenPayloadType = {
      userId,
      userLogin,
      exp: accessTokenExpiresIn,
    };
    const accessToken: string = this.jwtService.sign(accessTokenPayload, {
      secret: this.accessTokenSecret,
    });
    return accessToken;
  }

  createNewTokensPair({
    userId,
    userLogin,
    deviceId,
    uniqueKey,
  }: CreateNewTokensPairData): CreateNewTokensPairReturnType {
    const refreshToken: string = this.createRefreshToken({
      userId,
      userLogin,
      deviceId,
      uniqueKey,
    });
    return {
      newAccessToken: this.createAccessToken({ userId, userLogin }),
      newRefreshToken: refreshToken,
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

  /* расшифровывает access token, проверяет не истекло ли время жизни access token
   и в случае успеха (время жизни не истекло и валиден токен) возвращает payload of access token
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

export type CreateNewTokensPairReturnType = {
  newAccessToken: string;
  newRefreshToken: string;
};

export type CreateNewTokensPairData = {
  userId: string;
  userLogin: string;
  deviceId: string;
  uniqueKey: string;
};
