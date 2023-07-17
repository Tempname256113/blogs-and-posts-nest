import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { PublicCommentRepositorySQL } from '../../infrastructure/repositories/comment-public.repository-sql';
import { CommentViewModel } from '../../api/models/comment-api.models';
import { PublicCommentQueryRepositorySQL } from '../../infrastructure/repositories/comment-public.query-repository-sql';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

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
    private readonly commentRepositorySQL: PublicCommentRepositorySQL,
    private readonly commentQueryRepositorySQL: PublicCommentQueryRepositorySQL,
    private jwtUtils: JwtUtils,
    @InjectDataSource() private readonly dataSource: DataSource,
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
        accessToken,
      });
    if (!foundedComment) {
      throw new NotFoundException();
    }
    const checkUserBanStatus = async () => {
      const foundedBannedUser: [{ is_banned: boolean }] =
        await this.dataSource.query(
          `
    SELECT u."is_banned"
    FROM public.users u
    WHERE u."id" = $1
    `,
          [userId],
        );
      if (foundedBannedUser.length < 1) throw new UnauthorizedException();
      if (foundedBannedUser[0].is_banned) throw new ForbiddenException();
    };
    await checkUserBanStatus();
    await this.commentRepositorySQL.commentChangeLikeStatus({
      commentId,
      userId,
      likeStatus: reaction,
    });
  }
}
