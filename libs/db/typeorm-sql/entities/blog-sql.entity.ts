import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { UserSQLEntity } from './users/user-sql.entity';
import { PostSQLEntity } from './post-sql.entity';

@Entity({ name: 'blogs_typeorm' })
export class BlogSQLEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', nullable: true })
  bloggerId: number;

  @Column({ type: 'varchar', length: 15 })
  name: string;

  @Column({ type: 'varchar', length: 500 })
  description: string;

  @Column({ type: 'varchar', length: 100 })
  websiteUrl: string;

  @Column({ type: 'timestamp', default: new Date().toISOString() })
  createdAt: string;

  @Column({ type: 'boolean' })
  isMembership: boolean;

  @Column({ type: 'boolean' })
  isBanned: boolean;

  @Column({ type: 'timestamp', nullable: true })
  banDate: string | null;

  @Column({ type: 'boolean', default: false })
  hidden: boolean;

  @ManyToOne(() => UserSQLEntity, (user) => user.blogs, {
    onDelete: 'SET NULL',
    cascade: true,
  })
  @JoinColumn({ name: 'bloggerId' })
  blogger: Relation<UserSQLEntity>;

  @OneToMany(() => PostSQLEntity, (post) => post.blog)
  posts: Relation<PostSQLEntity[]>;

  @ManyToMany(() => UserSQLEntity, (user) => user.bannedInBlogs, {
    onDelete: 'CASCADE',
  })
  bannedUsers: Relation<UserSQLEntity[]>;
}
