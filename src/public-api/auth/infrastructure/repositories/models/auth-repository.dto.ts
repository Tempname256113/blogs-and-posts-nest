export type SessionUpdateRepositoryDTO = {
  deviceId: string;
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

export type SessionRepositoryType = {
  deviceId: string;
  userId: string;
  uniqueKey: string;
  userIpAddress: string;
  userDeviceTitle: string;
  lastActiveDate: string;
};
