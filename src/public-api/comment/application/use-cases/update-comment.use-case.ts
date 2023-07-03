import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentDocument } from '../../../../../libs/db/mongoose/schemes/comment.entity';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CommentRepository } from '../../infrastructure/repositories/comment.repository';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { CommentQueryRepository } from '../../infrastructure/repositories/comment.query-repository';

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
    private commentQueryRepository: CommentQueryRepository,
    private commentRepository: CommentRepository,
    private jwtHelpers: JwtUtils,
  ) {}

  async execute({
    data: { commentId, content, accessToken },
  }: UpdateCommentCommand): Promise<void> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtHelpers.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const userId: string = accessTokenPayload.userId;
    const foundedComment: CommentDocument | null =
      await this.commentQueryRepository.getCommentDocumentById(commentId);
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
