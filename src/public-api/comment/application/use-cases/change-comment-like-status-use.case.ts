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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/users/user-sql.entity';

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
    private readonly jwtUtils: JwtUtils,
    @InjectRepository(UserSQLEntity)
    private readonly userEntity: Repository<UserSQLEntity>,
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
      const foundedBannedUser: UserSQLEntity | null =
        await this.userEntity.findOneBy({ id: Number(userId) });
      if (!foundedBannedUser) throw new UnauthorizedException();
      if (foundedBannedUser.isBanned) throw new ForbiddenException();
    };
    await checkUserBanStatus();
    await this.commentRepositorySQL.commentChangeLikeStatus({
      commentId,
      userId,
      likeStatus: reaction,
    });
  }
}
