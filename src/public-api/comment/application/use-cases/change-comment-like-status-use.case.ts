import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { PublicCommentRepositorySql } from '../../infrastructure/repositories/comment-public.repository-sql';
import { CommentViewModel } from '../../api/models/comment-api.models';
import { PublicCommentQueryRepositorySQL } from '../../infrastructure/repositories/comment-public.query-repository-sql';

export class ChangeCommentLikeStatusCommand {
  constructor(
    public readonly data: {
      commentId: string;
      reaction: 'Like' | 'Dislike' | 'None';
      accessToken: string;
    },
  ) {}
}

@CommandHandler(ChangeCommentLikeStatusCommand)
export class ChangeCommentLikeStatusUseCase
  implements ICommandHandler<ChangeCommentLikeStatusCommand, void>
{
  constructor(
    private readonly commentRepositorySQL: PublicCommentRepositorySql,
    private readonly commentQueryRepositorySQL: PublicCommentQueryRepositorySQL,
    private jwtUtils: JwtUtils,
  ) {}

  async execute({
    data: { commentId, reaction, accessToken },
  }: ChangeCommentLikeStatusCommand): Promise<void> {
    if (!Number(commentId)) {
      throw new NotFoundException();
    }
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const userId = accessTokenPayload.userId;
    const foundedComment: CommentViewModel | null =
      await this.commentQueryRepositorySQL.getCommentById({
        commentId,
        userId,
      });
    if (!foundedComment) {
      throw new NotFoundException();
    }
    await this.commentRepositorySQL.commentChangeLikeStatus({
      commentId,
      userId,
      likeStatus: reaction,
    });
  }
}
