import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { PublicCommentQueryRepositorySQL } from '../../infrastructure/repositories/comment-public.query-repository-sql';
import { PublicCommentRepositorySQL } from '../../infrastructure/repositories/comment-public.repository-sql';
import { CommentViewModel } from '../../api/models/comment-api.models';

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
    private readonly commentQueryRepositorySQL: PublicCommentQueryRepositorySQL,
    private readonly commentRepositorySQL: PublicCommentRepositorySQL,
    private readonly jwtUtils: JwtUtils,
  ) {}

  async execute({
    data: { commentId, content, accessToken },
  }: UpdateCommentCommand): Promise<void> {
    if (!Number(commentId)) {
      throw new NotFoundException();
    }
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const userId: string = accessTokenPayload.userId;
    const foundedComment: CommentViewModel | null =
      await this.commentQueryRepositorySQL.getCommentById({
        commentId,
        accessToken,
      });
    if (!foundedComment) {
      throw new NotFoundException();
    }
    if (foundedComment.commentatorInfo.userId !== userId) {
      throw new ForbiddenException();
    }
    await this.commentRepositorySQL.updateComment({ commentId, content });
  }
}
