import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtRefreshTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { SessionSecurityViewModel } from '../../api/models/security-api.models';
import { SessionRepositoryType } from '../../../auth/infrastructure/repositories/models/auth-repository.dto';

@Injectable()
export class SecurityQueryRepositorySQL {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getAllActiveSessions(
    refreshTokenPayload: JwtRefreshTokenPayloadType,
  ): Promise<SessionSecurityViewModel[]> {
    const result: any[] = await this.dataSource.query(
      `
    SELECT s.device_id, s.user_ip_address, s.user_device_title, s.last_active_date
    FROM public.sessions s
    WHERE s.user_id = $1
    `,
      [refreshTokenPayload.userId],
    );
    const mappedSessionArray: SessionSecurityViewModel[] = [];
    for (const rawSession of result) {
      const mappedSession: SessionSecurityViewModel = {
        ip: rawSession.user_ip_address,
        deviceId: String(rawSession.device_id),
        title: rawSession.user_device_title,
        lastActiveDate: rawSession.last_active_date,
      };
      mappedSessionArray.push(mappedSession);
    }
    return mappedSessionArray;
  }

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
    if (result.length < 1) return null;
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
