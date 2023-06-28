import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtRefreshTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { SessionSecurityViewModel } from '../../api/models/security-api.models';

@Injectable()
export class SecurityQueryRepositorySQL {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getAllActiveSessions(
    refreshTokenPayload: JwtRefreshTokenPayloadType,
  ): Promise<SessionSecurityViewModel[]> {
    const result: any[] = await this.dataSource.query(
      `
    SELECT s.device_id, s.user_ip_address, s.user_device_title, u.last_active_date
    FROM public.sessions s
    WHERE s.user_id = $1
    `,
      [refreshTokenPayload.userId],
    );
    const mappedSessionArray: SessionSecurityViewModel[] = [];
    for (const rawSession of result) {
      const mappedSession: SessionSecurityViewModel = {
        ip: rawSession.user_ip_address,
        deviceId: rawSession.device_id,
        title: rawSession.user_device_title,
        lastActiveDate: rawSession.last_active_date,
      };
      mappedSessionArray.push(mappedSession);
    }
    return mappedSessionArray;
  }
}
