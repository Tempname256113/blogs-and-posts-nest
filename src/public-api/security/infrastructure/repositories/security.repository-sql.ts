import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { SessionSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/users/session-sql.entity';

@Injectable()
export class SecurityRepositorySQL {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(SessionSQLEntity)
    private readonly sessionEntity: Repository<SessionSQLEntity>,
  ) {}

  async deleteAllSessionsExceptCurrent({
    userId,
    deviceId,
  }: {
    userId: string;
    deviceId: string;
  }): Promise<void> {
    await this.sessionEntity.delete({
      userId: Number(userId),
      deviceId: Not(Number(deviceId)),
    });
  }

  async deleteAllSessionsByUserId(userId: number): Promise<void> {
    await this.sessionEntity.delete({ userId });
  }

  async deleteSessionByDeviceId(deviceId: number): Promise<void> {
    await this.sessionEntity.delete(deviceId);
  }
}
