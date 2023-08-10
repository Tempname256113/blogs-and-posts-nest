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
    const newComment: CommentSQLEntity = new CommentSQLEntity();
    newComment.postId = Number(postId);
    newComment.userId = Number(userId);
    newComment.content = content;
    newComment.createdAt = new Date().toISOString();
    newComment.hidden = false;
    const result: CommentSQLEntity = await this.commentEntity.save(newComment);
    return {
      createdCommentId: String(result.id),
      commentCreatedAt: result.createdAt,
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
    await this.commentEntity.delete(commentId);
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
