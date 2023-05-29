import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  LikeDocument,
  LikeSchema,
} from '../../../../../libs/db/mongoose/schemes/like.entity';
import { FilterQuery, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

export class ChangeEntityLikeStatusCommand {
  constructor(
    public readonly data: {
      entity: 'post' | 'comment';
      entityId: string;
      userId: string;
      userLogin: string;
      likeStatus: 'Like' | 'Dislike' | 'None';
    },
  ) {}
}

@CommandHandler(ChangeEntityLikeStatusCommand)
export class ChangeEntityLikeStatusUseCase
  implements ICommandHandler<ChangeEntityLikeStatusCommand, void>
{
  constructor(
    @InjectModel(LikeSchema.name) private LikeModel: Model<LikeSchema>,
  ) {}

  async execute({
    data: { entity, entityId, userId, userLogin, likeStatus },
  }: ChangeEntityLikeStatusCommand): Promise<void> {
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
    const filter: FilterQuery<LikeSchema> = {
      $and: [{ userId }, { entityId }],
    };
    if (likeStatus === 'Like' || likeStatus === 'Dislike') {
      const updateReactionResult = await this.LikeModel.updateOne(filter, {
        likeStatus,
        addedAt: new Date().toISOString(),
      });
      const updateReactionStatus: boolean =
        updateReactionResult.matchedCount > 0;
      if (!updateReactionStatus) {
        const newReaction: LikeDocument = createReaction();
        await newReaction.save();
      }
    } else if (likeStatus === 'None') {
      await this.LikeModel.deleteOne(filter);
    }
  }
}
