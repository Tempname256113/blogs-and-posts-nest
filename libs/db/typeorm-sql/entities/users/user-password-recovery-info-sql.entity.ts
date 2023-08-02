import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  Relation,
} from 'typeorm';
import { UserSQLEntity } from './user-sql.entity';

@Entity({ name: 'users_password_recovery_info_typeorm' })
export class UserPasswordRecoveryInfoSQLEntity {
  @PrimaryColumn({ type: 'integer' })
  userId: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  recoveryCode: string | null;

  @Column({ type: 'boolean' })
  recoveryStatus: boolean;

  @OneToOne(() => UserSQLEntity, (user) => user.passwordRecoveryInfo, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: Relation<UserSQLEntity>;
}
