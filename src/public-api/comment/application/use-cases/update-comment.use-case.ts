import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CommentDocument,
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
import { JwtHelpers } from '../../../../../libs/auth/jwt/jwt-helpers.service';

export class UpdateCommentCommand {
  constructor(
    public readonly data: {
      commentId: string;
      content: string;
      accessToken: string;
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
    private jwtHelpers: JwtHelpers,
  ) {}

  async execute({
    data: { commentId, content, accessToken },
  }: UpdateCommentCommand): Promise<void> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtHelpers.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const userId = accessTokenPayload.userId;
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
