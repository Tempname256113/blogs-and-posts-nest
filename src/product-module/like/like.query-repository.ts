import {
  Like,
  LikeSchema,
} from '../../../libs/db/mongoose/schemes/like.entity';
import { FilterQuery, Model } from 'mongoose';
import { EntityLikesCountType } from './like-application/like.service';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LikeQueryRepository {
  constructor(
    @InjectModel(LikeSchema.name) private LikeModel: Model<LikeSchema>,
  ) {}

  async getEntityLikesCount(entityId: string): Promise<EntityLikesCountType> {
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

  async getEntityLastLikes(entityId: string): Promise<Like[]> {
    const fewLastLikes: Like[] = await this.LikeModel.find(
      {
        $and: [{ entityId }, { likeStatus: 'Like' }],
      },
      { _id: false },
      { sort: { addedAt: -1 }, limit: 3 },
    ).lean();
    return fewLastLikes;
  }

  async getUserLikeStatus({
    userId,
    entityId,
  }: {
    userId: string;
    entityId: string;
  }): Promise<'Like' | 'Dislike' | 'None'> {
    const filter: FilterQuery<any> = { $and: [{ userId }, { entityId }] };
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
  }
}
