import { Injectable } from '@nestjs/common';
import { SessionRepositoryType } from './models/auth-repository.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthQueryRepositorySQL {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getSessionByDeviceId(
    deviceId: number,
  ): Promise<SessionRepositoryType | null> {
    const result: any[] = await this.dataSource.query(
      `
    SELECT * FROM public.sessions s
    WHERE s.device_id = $1
    `,
      [deviceId],
    );
    if (result.length < 1) {
      return null;
    }
    const res: any = result[0];
    const session: SessionRepositoryType = {
      deviceId: res.device_id,
      userId: res.user_id,
      uniqueKey: res.unique_key,
      userIpAddress: res.user_ip_address,
      userDeviceTitle: res.user_device_title,
      lastActiveDate: res.last_active_date,
    };
    return session;
  }
}
