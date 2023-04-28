import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Like, LikeDocument, LikeSchema } from '../product-domain/like.entity';
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

  async getEntityLikesCount(
    entityId: string,
  ): Promise<{ likesCount: number; dislikesCount: number }> {
    const likesCount: number = await this.LikeModel.countDocuments({
      entityId,
      likeStatus: 'Like',
    });
    const dislikesCount: number = await this.LikeModel.countDocuments({
      entityId,
      likeStatus: 'Dislike',
    });
    return {
      likesCount,
      dislikesCount,
    };
  }

  async getEntityLastLikesAndUserLikeStatus({
    entityId,
    userId,
    getLastLikes,
  }: {
    entityId: string;
    userId: string;
    getLastLikes: boolean;
  }): Promise<{
    userLikeStatus: 'Like' | 'Dislike' | 'None';
    lastLikes: Like[] | null;
  }> {
    const filter: FilterQuery<any> = { $and: [{ userId }, { entityId }] };
    const getCurrentUserLikeStatus = async (): Promise<
      'Like' | 'Dislike' | 'None'
    > => {
      const foundedReaction: Like | null = await this.LikeModel.findOne(
        filter,
      ).lean();
      let currentUserLikeStatus: 'Like' | 'Dislike' | 'None';
      if (!foundedReaction) {
        currentUserLikeStatus = 'None';
      } else {
        currentUserLikeStatus = foundedReaction.likeStatus;
      }
      return currentUserLikeStatus;
    };
    const getFewLastLikes = async (): Promise<Like[]> => {
      const fewLastLikes: Like[] = await this.LikeModel.find(
        {
          $and: [{ entityId }, { likeStatus: 'Like' }],
        },
        { _id: false },
        { sort: { addedAt: -1 }, limit: 3 },
      ).lean();
      return fewLastLikes;
    };
    if (getLastLikes) {
      const currentUserLikeStatus: 'Like' | 'Dislike' | 'None' =
        await getCurrentUserLikeStatus();
      const lastLikes: Like[] = await getFewLastLikes();
      return {
        userLikeStatus: currentUserLikeStatus,
        lastLikes,
      };
    } else {
      const currentUserLikeStatus: 'Like' | 'Dislike' | 'None' =
        await getCurrentUserLikeStatus();
      return {
        userLikeStatus: currentUserLikeStatus,
        lastLikes: null,
      };
    }
  }
}
