export type SessionUpdateRepositoryDTO = {
  deviceId: number;
  uniqueKey: string;
  userIpAddress: string;
  userDeviceTitle: string;
};

export type SessionCreateRepositoryDTO = {
  userId: string;
  uniqueKey: string;
  userIpAddress: string;
  userDeviceTitle: string;
};
