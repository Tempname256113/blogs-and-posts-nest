import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class SecurityRepositorySQL {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async deleteAllSessionsExceptCurrent({
    userId,
    deviceId,
  }: {
    userId: string;
    deviceId: string;
  }): Promise<void> {
    await this.dataSource.query(
      `
    DELETE FROM public.sessions s
    WHERE s.user_id = $1 AND s.device_id != $2
    `,
      [userId, deviceId],
    );
  }

  async deleteAllSessionsByUserId(userId: number): Promise<void> {
    await this.dataSource.query(
      `
    DELETE FROM public.sessions s
    WHERE s.user_id = $1
    `,
      [userId],
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
