import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LikeDocument, LikeSchema } from '../product-domain/like.entity';
import { FilterQuery, Model } from 'mongoose';

@Injectable()
export class LikeService {
  constructor(
    @InjectModel(LikeSchema.name) private LikeModel: Model<LikeSchema>,
  ) {}

  async changeEntityLikeStatus({
    entity,
    entityId,
    userId,
    userLogin,
    likeStatus,
  }: {
    entity: 'post' | 'comment';
    entityId: string;
    userId: string;
    userLogin: string;
    likeStatus: 'Like' | 'Dislike' | 'None';
  }): Promise<void> {
    const createReaction = (): LikeDocument => {
      const newReaction: LikeDocument = new this.LikeModel({
        entity,
        entityId,
        userId,
        userLogin,
        likeStatus,
        addedAt: new Date().toISOString(),
      });
      return newReaction;
    };
    const filter: FilterQuery<any> = { $and: [{ userId }, { entityId }] };
    if (likeStatus === 'Like' || likeStatus === 'Dislike') {
      const updateReactionResult = await this.LikeModel.updateOne(filter, {
        likeStatus,
        addedAt: new Date().toISOString(),
      });
      const updateReactionStatus: boolean =
        updateReactionResult.matchedCount > 0;
      if (!updateReactionStatus) {
        const newReaction: LikeDocument = createReaction();
        newReaction.save();
      }
    } else if (likeStatus === 'None') {
      await this.LikeModel.deleteOne(filter);
    }
  }
}
