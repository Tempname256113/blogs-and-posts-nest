import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { BlogSQLEntity } from './blog-sql.entity';
import { CommentSQLEntity } from './comment-sql.entity';
import { LikeSQLEntity } from './like-sql.entity';

@Entity({ name: 'posts_typeorm' })
export class PostSQLEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  blogId: number;

  @Column({ type: 'varchar', length: 30 })
  title: string;

  @Column({ type: 'varchar', length: 100 })
  shortDescription: string;

  @Column({ type: 'varchar', length: 1000 })
  content: string;

  @Column({ type: 'timestamp', default: new Date().toISOString() })
  createdAt: string;

  @Column({ type: 'boolean', default: false })
  hidden: boolean;

  @ManyToOne(() => BlogSQLEntity, (blog) => blog.posts, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  @JoinColumn({ name: 'blogId' })
  blog: Relation<BlogSQLEntity>;

  @OneToMany(() => CommentSQLEntity, (comment) => comment.post)
  comments: Relation<CommentSQLEntity[]>;

  @OneToMany(() => LikeSQLEntity, (like) => like.post)
  likes: Relation<LikeSQLEntity[]>;
}
