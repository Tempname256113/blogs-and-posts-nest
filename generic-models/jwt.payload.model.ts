export type JwtAccessTokenPayloadType = {
  userId: number;
  userLogin: string;
  iat?: number;
  exp: number;
};

export type JwtRefreshTokenPayloadType = {
  userId: number;
  userLogin: string;
  deviceId: number;
  uniqueKey: string;
  iat?: number;
  exp: number;
};
