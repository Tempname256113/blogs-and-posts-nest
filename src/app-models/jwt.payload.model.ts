export type JwtPayloadModelType = {
  userId: string;
  deviceId: string;
  iat?: number;
  exp?: number;
};
