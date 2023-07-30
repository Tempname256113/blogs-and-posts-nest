import { Injectable } from '@nestjs/common';
import { SessionRepositoryType } from './models/auth-repository.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/users/session-sql.entity';

@Injectable()
export class AuthQueryRepositorySQL {
  constructor(
    @InjectRepository(SessionSQLEntity)
    private readonly sessionEntity: Repository<SessionSQLEntity>,
  ) {}

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
