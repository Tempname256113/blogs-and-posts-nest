import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { CommentSQLEntity } from './comment-sql.entity';
import { PostSQLEntity } from './post-sql.entity';
import { UserSQLEntity } from './users/user-sql.entity';

@Entity({ name: 'likes_typeorm' })
export class LikeSQLEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', nullable: true })
  commentId: number;

  @Column({ type: 'integer', nullable: true })
  postId: number;

  @Column({ type: 'integer' })
  userId: number;

  @Column({ type: 'boolean' })
  likeStatus: boolean;

  @Column({ type: 'timestamp', default: new Date().toISOString() })
  addedAt: string;

  @Column({ type: 'boolean' })
  hidden: boolean;

  @ManyToOne(() => CommentSQLEntity, (comment) => comment.likes, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  @JoinColumn({ name: 'commentId' })
  comment: Relation<CommentSQLEntity>;

  @ManyToOne(() => PostSQLEntity, (post) => post.likes, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  @JoinColumn({ name: 'postId' })
  post: Relation<PostSQLEntity>;

  @ManyToOne(() => UserSQLEntity, (user) => user.likes, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  @JoinColumn({ name: 'userId' })
  user: Relation<UserSQLEntity>;
}
