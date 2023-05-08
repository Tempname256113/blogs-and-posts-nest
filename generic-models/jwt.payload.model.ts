export type JwtAccessTokenPayloadType = {
  userId: string;
  userLogin: string;
  iat?: number;
  exp: number;
};

export type JwtRefreshTokenPayloadType = {
  userId: string;
  userLogin: string;
  deviceId: string;
  iat: number;
  exp: number;
};
