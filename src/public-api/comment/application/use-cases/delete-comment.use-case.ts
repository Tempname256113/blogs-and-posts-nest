import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Comment,
  CommentSchema,
} from '../../../../../libs/db/mongoose/schemes/comment.entity';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommentRepository } from '../../infrastructure/repositories/comment.repository';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';

export class DeleteCommentCommand {
  constructor(
    public readonly data: { commentId: string; accessToken: string },
  ) {}
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentUseCase
  implements ICommandHandler<DeleteCommentCommand, void>
{
  constructor(
    @InjectModel(CommentSchema.name) private CommentModel: Model<CommentSchema>,
    private commentRepository: CommentRepository,
    private jwtHelpers: JwtUtils,
  ) {}

  async execute({
    data: { commentId, accessToken },
  }: DeleteCommentCommand): Promise<void> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtHelpers.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const userId = accessTokenPayload.userId;
    const foundedComment: Comment | null = await this.CommentModel.findOne({
      id: commentId,
    });
    if (!foundedComment) {
      throw new NotFoundException();
    }
    if (foundedComment.userId !== userId) {
      throw new ForbiddenException();
    }
    await this.commentRepository.deleteComment(commentId);
  }
}
