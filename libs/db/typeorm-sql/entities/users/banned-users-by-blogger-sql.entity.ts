import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'banned_users_by_blogger_typeorm' })
export class BannedUsersByBloggerSQLEntity {
  @PrimaryColumn({ type: 'integer' })
  userId: number;

  @PrimaryColumn({ type: 'integer' })
  blogId: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  banReason: string;

  @Column({ type: 'timestamp' })
  banDate: string;
}
