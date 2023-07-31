import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JwtRefreshTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { SessionSecurityViewModel } from '../../api/models/security-api.models';
import { SessionRepositoryType } from '../../../auth/infrastructure/repositories/models/auth-repository.dto';
import { SessionSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/users/session-sql.entity';

@Injectable()
export class SecurityQueryRepositorySQL {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(SessionSQLEntity)
    private readonly sessionEntity: Repository<SessionSQLEntity>,
  ) {}

  async getAllActiveSessions(
    refreshTokenPayload: JwtRefreshTokenPayloadType,
  ): Promise<SessionSecurityViewModel[]> {
    const result: SessionSQLEntity[] = await this.sessionEntity.findBy({
      userId: Number(refreshTokenPayload.userId),
    });
    const mappedSessionArray: SessionSecurityViewModel[] = result.map(
      (rawSession) => {
        const mappedSession: SessionSecurityViewModel = {
          ip: rawSession.userIpAddress,
          deviceId: String(rawSession.deviceId),
          title: rawSession.userDeviceTitle,
          lastActiveDate: rawSession.lastActiveDate,
        };
        return mappedSession;
      },
    );
    return mappedSessionArray;
  }

  async getSessionByDeviceId(
    deviceId: number,
  ): Promise<SessionRepositoryType | null> {
    const result: SessionSQLEntity | null = await this.sessionEntity.findOneBy({
      deviceId,
    });
    if (!result) return null;
    const session: SessionRepositoryType = {
      deviceId: String(result.deviceId),
      userId: String(result.userId),
      uniqueKey: result.uniqueKey,
      userIpAddress: result.userIpAddress,
      userDeviceTitle: result.userDeviceTitle,
      lastActiveDate: result.lastActiveDate,
    };
    return session;
  }
}
