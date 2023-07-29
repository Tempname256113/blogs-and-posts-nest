import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  SessionCreateRepositoryDTO,
  SessionUpdateRepositoryDTO,
} from './models/auth-repository.dto';
import { SessionSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/users/session-sql.entity';

export class AuthRepositorySQL {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(SessionSQLEntity)
    private readonly sessionEntity: Repository<SessionSQLEntity>,
  ) {}

  async createNewSession({
    userId,
    uniqueKey,
    userIpAddress,
    userDeviceTitle,
  }: SessionCreateRepositoryDTO): Promise<number> {
    const newSession: SessionSQLEntity = new SessionSQLEntity();
    newSession.userId = Number(userId);
    newSession.uniqueKey = uniqueKey;
    newSession.userIpAddress = userIpAddress;
    newSession.userDeviceTitle = userDeviceTitle;
    newSession.lastActiveDate = new Date().toISOString();
    await this.sessionEntity.save(newSession);
    return newSession.deviceId;
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
