import {
  Column,
  Entity,
  OneToOne,
  PrimaryColumn,
  Relation,
  JoinColumn,
} from 'typeorm';
import { UserSQLEntity } from './user-sql.entity';

@Entity({ name: 'users_email_confirmation_info_typeorm' })
export class UserEmailConfirmInfoSQLEntity {
  @PrimaryColumn({ type: 'integer' })
  userId: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  confirmationCode: string | null;

  @Column({ type: 'timestamp', nullable: true })
  expirationDate: string | null;

  @Column({ type: 'boolean' })
  isConfirmed: boolean;

  @OneToOne(() => UserSQLEntity, (user) => user.emailConfirmationInfo, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: Relation<UserSQLEntity>;
}
