import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { UserSQLEntity } from './user-sql.entity';

@Entity({ name: 'sessions_typeorm' })
export class SessionSQLEntity {
  @PrimaryGeneratedColumn()
  deviceId: number;

  @Column({ type: 'integer' })
  userId: number;

  @Column({ type: 'varchar', length: 100 })
  uniqueKey: string;

  @Column({ type: 'varchar', length: 40 })
  userIpAddress: string;

  @Column({ type: 'varchar', length: 300, default: 'unknown' })
  userDeviceTitle: string;

  @Column({ type: 'timestamp' })
  lastActiveDate: string;

  @ManyToOne(() => UserSQLEntity, (user) => user.sessions, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  @JoinColumn({ name: 'userId' })
  user: Relation<UserSQLEntity>;
}
