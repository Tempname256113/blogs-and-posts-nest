import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { PublicPostQueryRepositorySQL } from '../../infrastructure/repositories/post-public.query-repository-sql';
import { PostViewModel } from '../../api/models/post-api.models';
import { PublicPostRepositorySQL } from '../../infrastructure/repositories/post-public.repository-sql';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export class ChangePostLikeStatusCommand {
  constructor(
    public readonly data: {
      postId: string;
      likeStatus: 'Like' | 'Dislike' | 'None';
      accessToken: string;
    },
  ) {}
}

@CommandHandler(ChangePostLikeStatusCommand)
export class ChangePostLikeStatusUseCase
  implements ICommandHandler<ChangePostLikeStatusCommand, void>
{
  constructor(
    private readonly postQueryRepositorySQL: PublicPostQueryRepositorySQL,
    private readonly postRepositorySQL: PublicPostRepositorySQL,
    private jwtUtils: JwtUtils,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async execute({
    data: { postId, likeStatus, accessToken },
  }: ChangePostLikeStatusCommand): Promise<void> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const userId = accessTokenPayload.userId;
    const foundedPost: PostViewModel | null =
      await this.postQueryRepositorySQL.getPostById({ postId, accessToken });
    if (!foundedPost) {
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
    await this.postRepositorySQL.postChangeLikeStatus({
      postId,
      userId,
      likeStatus,
    });
  }
}
