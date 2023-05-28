import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Comment,
  CommentSchema,
} from '../../../../../libs/db/mongoose/schemes/comment.entity';
import { NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LikeService } from '../../../like/like.service';

export class ChangeLikeStatusCommand {
  constructor(
    public readonly data: {
      commentId: string;
      reaction: 'Like' | 'Dislike' | 'None';
      userId: string;
      userLogin: string;
    },
  ) {}
}

@CommandHandler(ChangeLikeStatusCommand)
export class ChangeLikeStatusUseCase
  implements ICommandHandler<ChangeLikeStatusCommand, void>
{
  constructor(
    @InjectModel(CommentSchema.name) private CommentModel: Model<CommentSchema>,
    private likeService: LikeService,
  ) {}

  async execute({
    data: { commentId, reaction, userId, userLogin },
  }: ChangeLikeStatusCommand): Promise<void> {
    const foundedComment: Comment | null = await this.CommentModel.findOne({
      id: commentId,
    });
    if (!foundedComment) {
      throw new NotFoundException();
    }
    await this.likeService.changeEntityLikeStatus({
      likeStatus: reaction,
      userId,
      userLogin,
      entityId: commentId,
      entity: 'comment',
    });
  }
}
