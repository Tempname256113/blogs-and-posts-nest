export type JwtAccessTokenPayloadType = {
  userId: string;
  iat?: number;
  exp?: number;
};

export type JwtRefreshTokenPayloadType = {
  userId: string;
  iat: number;
  exp?: number;
};
