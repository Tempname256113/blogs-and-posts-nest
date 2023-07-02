import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  SessionCreateRepositoryDTO,
  SessionUpdateRepositoryDTO,
} from './models/auth-repository.dto';

export class AuthRepositorySql {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async createNewSession({
    userId,
    uniqueKey,
    userIpAddress,
    userDeviceTitle,
  }: SessionCreateRepositoryDTO): Promise<number> {
    const result: any[] = await this.dataSource.query(
      `
    INSERT INTO public.sessions("user_id", "unique_key", "user_ip_address", "user_device_title")
    VALUES($1, $2, $3, $4)
    RETURNING "device_id"
    `,
      [userId, uniqueKey, userIpAddress, userDeviceTitle],
    );
    const sessionDeviceId: number = result[0].device_id;
    return sessionDeviceId;
  }

  async updateSession({
    uniqueKey,
    deviceId,
    userIpAddress,
    userDeviceTitle,
  }: SessionUpdateRepositoryDTO): Promise<void> {
    await this.dataSource.query(
      `
    UPDATE public.sessions
    SET unique_key = $1, user_ip_address = $2, user_device_title = $3, last_active_date = now()
    WHERE device_id = $4
    `,
      [uniqueKey, userIpAddress, userDeviceTitle, deviceId],
    );
  }

  async deleteSessionByDeviceId(deviceId: number): Promise<void> {
    await this.dataSource.query(
      `
    DELETE FROM public.sessions s
    WHERE s.device_id = $1
    `,
      [deviceId],
    );
  }
}
