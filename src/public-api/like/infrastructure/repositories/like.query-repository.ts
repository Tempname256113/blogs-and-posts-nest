import {
  Like,
  LikeSchema,
} from '../../../../../libs/db/mongoose/schemes/like.entity';
import { FilterQuery, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { EntityLikesCountType } from '../../application/models/entity-likes-count.model';

@Injectable()
export class LikeQueryRepository {
  constructor(
    @InjectModel(LikeSchema.name) private LikeModel: Model<LikeSchema>,
  ) {}

  async getEntityLikesCount(entityId: string): Promise<EntityLikesCountType> {
    const likesCount: number = await this.LikeModel.countDocuments({
      entityId,
      likeStatus: 'Like',
      hidden: false,
    });
    const dislikesCount: number = await this.LikeModel.countDocuments({
      entityId,
      likeStatus: 'Dislike',
      hidden: false,
    });
    return {
      likesCount,
      dislikesCount,
    };
  }

  async getEntityLastLikes(entityId: string): Promise<Like[]> {
    const fewLastLikes: Like[] = await this.LikeModel.find(
      { entityId, likeStatus: 'Like', hidden: false },
      { _id: false },
      { sort: { addedAt: -1 }, limit: 3 },
    ).lean();
    return fewLastLikes;
  }

  async getUserLikeStatus({
    userId,
    entityId,
  }: {
    userId: number;
    entityId: string;
  }): Promise<'Like' | 'Dislike' | 'None'> {
    const filter: FilterQuery<LikeSchema> = { userId, entityId, hidden: false };
    const foundedReaction: Like | null = await this.LikeModel.findOne(filter, {
      _id: false,
    }).lean();
    let currentUserLikeStatus: 'Like' | 'Dislike' | 'None';
    if (!foundedReaction) {
      currentUserLikeStatus = 'None';
    } else {
      currentUserLikeStatus = foundedReaction.likeStatus;
    }
    return currentUserLikeStatus;
  }
}
