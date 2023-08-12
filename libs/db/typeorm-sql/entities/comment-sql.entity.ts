import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { PostSQLEntity } from './post-sql.entity';
import { UserSQLEntity } from './users/user-sql.entity';
import { LikeSQLEntity } from './like-sql.entity';

@Entity({ name: 'comments_typeorm' })
export class CommentSQLEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  postId: number;

  @Column({ type: 'integer' })
  userId: number;

  @Column({ type: 'varchar', length: 300 })
  content: string;

  @Column({ type: 'timestamp' })
  createdAt: string;

  @Column({ type: 'boolean', default: false })
  hidden: boolean;

  @ManyToOne(() => PostSQLEntity, (post) => post.comments, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  @JoinColumn({ name: 'postId' })
  post: Relation<PostSQLEntity>;

  @ManyToOne(() => UserSQLEntity, (user) => user.comments, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  @JoinColumn({ name: 'userId' })
  user: Relation<UserSQLEntity>;

  @OneToMany(() => LikeSQLEntity, (like) => like.comment)
  likes: Relation<LikeSQLEntity[]>;
}
