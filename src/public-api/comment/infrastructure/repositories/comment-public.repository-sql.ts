import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PublicCommentRepositorySQL {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

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
    RETURNING "id"
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
    await this.dataSource.query(
      `
    UPDATE public.comments
    SET "content" = $1
    WHERE "id" = $2
    `,
      [content, commentId],
    );
  }

  async deleteComment(commentId: string): Promise<void> {
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
    const updateReaction = async (likeStatus: boolean) => {
      await this.dataSource.query(
        `
      UPDATE public.comments_likes
      SET like_status = $1, added_at = now()
      WHERE comment_id = $2 AND user_id = $3
      `,
        [likeStatus, commentId, userId],
      );
    };
    const createReaction = async (likeStatus: boolean) => {
      await this.dataSource.query(
        `
        INSERT INTO public.comments_likes("comment_id", "user_id", "like_status")
        VALUES($1, $2, $3)
        `,
        [commentId, userId, likeStatus],
      );
    };
    const deleteReaction = async () => {
      await this.dataSource.query(
        `
      DELETE FROM public.comments_likes
      WHERE comment_id = $1 AND user_id = $2
      `,
        [commentId, userId],
      );
    };
    if (likeStatus === 'Like' || likeStatus === 'Dislike') {
      let correctLikeStatus: boolean;
      if (likeStatus === 'Like') correctLikeStatus = true;
      if (likeStatus === 'Dislike') correctLikeStatus = false;
      const foundedReaction: any[] = await this.dataSource.query(
        `
      SELECT * 
      FROM public.comments_likes cl
      WHERE cl."comment_id" = $1 AND cl."user_id" = $2
      `,
        [commentId, userId],
      );
      if (foundedReaction.length > 0) {
        await updateReaction(correctLikeStatus);
      } else {
        await createReaction(correctLikeStatus);
      }
    } else if (likeStatus === 'None') {
      await deleteReaction();
    }
  }
}
