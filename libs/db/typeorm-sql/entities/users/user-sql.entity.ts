import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  JoinTable,
  Relation,
} from 'typeorm';
import { UserEmailConfirmInfoSQLEntity } from './user-email-confirm-info-sql.entity';
import { UserPasswordRecoveryInfoSQLEntity } from './user-password-recovery-info-sql.entity';
import { SessionSQLEntity } from './session-sql.entity';
import { BlogSQLEntity } from '../blog-sql.entity';
import { CommentSQLEntity } from '../comment-sql.entity';

@Entity({ name: 'users_typeorm' })
export class UserSQLEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10 })
  login: string;

  @Column({ type: 'varchar', length: 70 })
  email: string;

  @Column({ type: 'varchar', length: 100 })
  password: string;

  @Column({ type: 'timestamp', default: new Date().toISOString() })
  createdAt: string;

  @Column({ type: 'boolean', default: false })
  isBanned: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true, default: null })
  banReason: string | null;

  @Column({ type: 'timestamp', nullable: true, default: null })
  banDate: string | null;

  @OneToOne(() => UserEmailConfirmInfoSQLEntity, (info) => info.user)
  emailConfirmationInfo: Relation<UserEmailConfirmInfoSQLEntity>;

  @OneToOne(() => UserPasswordRecoveryInfoSQLEntity, (info) => info.user)
  passwordRecoveryInfo: Relation<UserPasswordRecoveryInfoSQLEntity>;

  @OneToMany(() => SessionSQLEntity, (session) => session.user)
  sessions: Relation<SessionSQLEntity[]>;

  @OneToMany(() => BlogSQLEntity, (blog) => blog.blogger)
  blogs: Relation<BlogSQLEntity[]>;

  @ManyToMany(() => BlogSQLEntity, (blog) => blog.bannedUsers, {
    onDelete: 'CASCADE',
  })
  @JoinTable({
    name: 'banned_users_by_blogger_typeorm',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'blogId', referencedColumnName: 'id' },
  })
  bannedInBlogs: Relation<BlogSQLEntity[]>;

  @OneToMany(() => CommentSQLEntity, (comment) => comment.user)
  comments: Relation<CommentSQLEntity[]>;
}
