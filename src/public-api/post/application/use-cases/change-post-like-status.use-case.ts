import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { PublicPostQueryRepositorySQL } from '../../infrastructure/repositories/post-public.query-repository-sql';
import { PostViewModel } from '../../api/models/post-api.models';
import { PublicPostRepositorySQL } from '../../infrastructure/repositories/post-public.repository-sql';

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
    await this.postRepositorySQL.postChangeLikeStatus({
      postId,
      userId,
      likeStatus,
    });
  }
}
