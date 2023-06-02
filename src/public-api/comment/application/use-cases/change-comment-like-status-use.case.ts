import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Comment,
  CommentSchema,
} from '../../../../../libs/db/mongoose/schemes/comment.entity';
import { NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChangeEntityLikeStatusCommand } from '../../../like/application/use-cases/change-entity-like-status.use-case';

export class ChangeCommentLikeStatusCommand {
  constructor(
    public readonly data: {
      commentId: string;
      reaction: 'Like' | 'Dislike' | 'None';
      userId: string;
      userLogin: string;
    },
  ) {}
}

@CommandHandler(ChangeCommentLikeStatusCommand)
export class ChangeCommentLikeStatusUseCase
  implements ICommandHandler<ChangeCommentLikeStatusCommand, void>
{
  constructor(
    @InjectModel(CommentSchema.name) private CommentModel: Model<CommentSchema>,
    private commandBus: CommandBus,
  ) {}

  async execute({
    data: { commentId, reaction, userId, userLogin },
  }: ChangeCommentLikeStatusCommand): Promise<void> {
    const foundedComment: Comment | null = await this.CommentModel.findOne({
      id: commentId,
    });
    if (!foundedComment) {
      throw new NotFoundException();
    }
    await this.commandBus.execute(
      new ChangeEntityLikeStatusCommand({
        likeStatus: reaction,
        userId,
        userLogin,
        entityId: commentId,
        entity: 'comment',
      }),
    );
  }
}