import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export class AuthRepositorySql {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async createNewSession({
    userId,
    deviceId,
    refreshTokenIat,
    userIpAddress,
    userDeviceTitle,
  }: {
    userId: string;
    refreshTokenIat: number;
    deviceId: string;
    userIpAddress: string;
    userDeviceTitle: string;
  }): Promise<void> {
    await this.dataSource.query(
      `
    INSERT INTO public.sessions("user_id", "device_id", "iat", "user_ip_address", "user_device_title")
    VALUES($1, $2, $3, $4, $5)
    `,
      [userId, deviceId, refreshTokenIat, userIpAddress, userDeviceTitle],
    );
  }
}
