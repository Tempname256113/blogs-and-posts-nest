import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PublicPostRepositorySQL {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async postChangeLikeStatus({
    postId,
    userId,
    likeStatus,
  }: {
    postId: string;
    userId: string;
    likeStatus: 'None' | 'Like' | 'Dislike';
  }): Promise<void> {
    const updateReaction = async (likeStatus: boolean) => {
      await this.dataSource.query(
        `
      UPDATE public.posts_likes
      SET like_status = $1, added_at = now()
      WHERE post_id = $2 AND user_id = $3
      `,
        [likeStatus, postId, userId],
      );
    };
    const createReaction = async (likeStatus: boolean) => {
      await this.dataSource.query(
        `
        INSERT INTO public.posts_likes("post_id", "user_id", "like_status")
        VALUES($1, $2, $3)
        `,
        [postId, userId, likeStatus],
      );
    };
    const deleteReaction = async () => {
      await this.dataSource.query(
        `
      DELETE FROM public.posts_likes
      WHERE post_id = $1 AND user_id = $2
      `,
        [postId, userId],
      );
    };
    if (likeStatus === 'Like' || likeStatus === 'Dislike') {
      let correctLikeStatus: boolean;
      if (likeStatus === 'Like') correctLikeStatus = true;
      if (likeStatus === 'Dislike') correctLikeStatus = false;
      const foundedReaction: any[] = await this.dataSource.query(
        `
      SELECT * 
      FROM public.posts_likes pl
      WHERE pl."post_id" = $1 AND pl."user_id" = $2 AND pl."hidden" = false
      `,
        [postId, userId],
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
