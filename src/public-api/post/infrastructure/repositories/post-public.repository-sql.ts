import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { LikeSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/like-sql.entity';

@Injectable()
export class PublicPostRepositorySQL {
  constructor(
    @InjectRepository(LikeSQLEntity)
    private readonly likeEntity: Repository<LikeSQLEntity>,
  ) {}

  async postChangeLikeStatus({
    postId,
    userId,
    likeStatus,
  }: {
    postId: string;
    userId: string;
    likeStatus: 'None' | 'Like' | 'Dislike';
  }): Promise<void> {
    const updateReaction = async (likeStatus: boolean): Promise<void> => {
      await this.likeEntity.update(
        { postId: Number(postId), userId: Number(userId) },
        { likeStatus, addedAt: new Date().toISOString() },
      );
    };
    const createReaction = async (likeStatus: boolean): Promise<void> => {
      await this.likeEntity.insert({
        postId: Number(postId),
        userId: Number(userId),
        likeStatus,
        addedAt: new Date().toISOString(),
        hidden: false,
      });
    };
    const deleteReaction = async (): Promise<void> => {
      await this.likeEntity.delete({
        postId: Number(postId),
        userId: Number(userId),
      });
    };
    if (likeStatus === 'Like' || likeStatus === 'Dislike') {
      let correctLikeStatus: boolean;
      if (likeStatus === 'Like') correctLikeStatus = true;
      if (likeStatus === 'Dislike') correctLikeStatus = false;
      const foundedReaction: LikeSQLEntity | null =
        await this.likeEntity.findOneBy({
          postId: Number(postId),
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
