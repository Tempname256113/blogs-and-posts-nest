import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CommentSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/comment-sql.entity';
import { LikeSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/like-sql.entity';

@Injectable()
export class PublicCommentRepositorySQL {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(CommentSQLEntity)
    private readonly commentEntity: Repository<CommentSQLEntity>,
    @InjectRepository(LikeSQLEntity)
    private readonly likeEntity: Repository<LikeSQLEntity>,
  ) {}

  async createNewComment({
    postId,
    userId,
    content,
  }: {
    postId: string;
    userId: string;
    content: string;
  }): Promise<{ createdCommentId: string; commentCreatedAt: string }> {
    const result: any[] = await this.dataSource.query(
      `
    INSERT INTO public."comments"("post_id", "user_id", "content")
    VALUES($1, $2, $3)
    RETURNING "id", "created_at"
    `,
      [postId, userId, content],
    );
    return {
      createdCommentId: String(result[0].id),
      commentCreatedAt: result[0].created_at,
    };
  }

  async updateComment({
    commentId,
    content,
  }: {
    commentId: string;
    content: string;
  }): Promise<void> {
    await this.commentEntity.update(commentId, { content });
  }

  async deleteComment(commentId: string): Promise<void> {
    if (!Number(commentId)) {
      throw new NotFoundException();
    }
    await this.dataSource.query(
      `
    DELETE FROM public.comments
    WHERE "id" = $1
    `,
      [commentId],
    );
  }

  async commentChangeLikeStatus({
    commentId,
    userId,
    likeStatus,
  }: {
    commentId: string;
    userId: string;
    likeStatus: 'None' | 'Like' | 'Dislike';
  }): Promise<void> {
    const updateReaction = async (likeStatus: boolean): Promise<void> => {
      await this.likeEntity.update(
        {
          commentId: Number(commentId),
          userId: Number(userId),
        },
        { likeStatus, addedAt: new Date().toISOString() },
      );
    };
    const createReaction = async (likeStatus: boolean): Promise<void> => {
      await this.likeEntity.insert({
        commentId: Number(commentId),
        userId: Number(userId),
        likeStatus,
        addedAt: new Date().toISOString(),
        hidden: false,
      });
    };
    const deleteReaction = async (): Promise<void> => {
      await this.likeEntity.delete({
        commentId: Number(commentId),
        userId: Number(userId),
      });
    };
    if (likeStatus === 'Like' || likeStatus === 'Dislike') {
      let correctLikeStatus: boolean;
      if (likeStatus === 'Like') correctLikeStatus = true;
      if (likeStatus === 'Dislike') correctLikeStatus = false;
      const foundedReaction: LikeSQLEntity | null =
        await this.likeEntity.findOneBy({
          commentId: Number(commentId),
          userId: Number(userId),
          hidden: false,
        });
      if (foundedReaction) {
        await updateReaction(correctLikeStatus);
      } else {
        await createReaction(correctLikeStatus);
      }
    } else if (likeStatus === 'None') {
      await deleteReaction();
    }
  }
}
