import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CommentDocument,
  CommentSchema,
} from '../../../../../libs/db/mongoose/schemes/comment.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommentRepository } from '../../comment-infrastructure/comment-repositories/comment.repository';

export class UpdateCommentCommand {
  constructor(
    public readonly data: {
      commentId: string;
      content: string;
      userId: string;
    },
  ) {}
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase
  implements ICommandHandler<UpdateCommentCommand, void>
{
  constructor(
    @InjectModel(CommentSchema.name) private CommentModel: Model<CommentSchema>,
    private commentRepository: CommentRepository,
  ) {}

  async execute({
    data: { commentId, content, userId },
  }: UpdateCommentCommand): Promise<void> {
    const foundedComment: CommentDocument | null =
      await this.CommentModel.findOne({
        id: commentId,
      });
    if (!foundedComment) {
      throw new NotFoundException();
    }
    if (foundedComment.userId !== userId) {
      throw new ForbiddenException();
    }
    foundedComment.content = content;
    await this.commentRepository.saveComment(foundedComment);
  }
}
