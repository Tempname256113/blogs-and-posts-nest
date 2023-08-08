import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { BloggerBlogQueryRepositorySQL } from '../../infrastructure/repositories/blog-blogger.query-repository-sql';
import { BloggerPostQueryRepositorySQL } from '../../infrastructure/repositories/post-blogger.query-repository-sql';
import {
  BloggerRepositoryBlogType,
  BloggerRepositoryPostType,
} from '../../infrastructure/repositories/models/blogger-repository.models';
import { BloggerPostRepositorySQL } from '../../infrastructure/repositories/post-blogger.repository-sql';

export class DeletePostByBlogIdCommand {
  constructor(
    public readonly data: {
      blogId: string;
      postId: string;
      accessToken: string;
    },
  ) {}
}

@CommandHandler(DeletePostByBlogIdCommand)
export class DeletePostByBlogIdUseCase
  implements ICommandHandler<DeletePostByBlogIdCommand, void>
{
  constructor(
    private readonly jwtUtils: JwtUtils,
    private readonly postRepositorySQL: BloggerPostRepositorySQL,
    private readonly blogQueryRepositorySQL: BloggerBlogQueryRepositorySQL,
    private readonly postQueryRepositorySQL: BloggerPostQueryRepositorySQL,
  ) {}

  async execute({
    data: { blogId, postId, accessToken },
  }: DeletePostByBlogIdCommand): Promise<void> {
    const accessTokenPayload: JwtAccessTokenPayloadType =
      this.getAccessTokenPayload(accessToken);
    await this.checkBlogOwner({ blogId, accessTokenPayload });
    await this.checkPostOwner({ blogId, postId });
    await this.postRepositorySQL.deletePostById(postId);
  }

  getAccessTokenPayload(accessToken: string): JwtAccessTokenPayloadType {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    return accessTokenPayload;
  }

  async checkBlogOwner({
    blogId,
    accessTokenPayload,
  }: {
    blogId: string;
    accessTokenPayload: JwtAccessTokenPayloadType;
  }): Promise<void> {
    const foundedBlog: BloggerRepositoryBlogType | null =
      await this.blogQueryRepositorySQL.getBlogByIdInternalUse(blogId);
    if (!foundedBlog) throw new NotFoundException();
    if (foundedBlog.bloggerId !== accessTokenPayload.userId) {
      throw new ForbiddenException();
    }
  }

  async checkPostOwner({
    postId,
    blogId,
  }: {
    postId: string;
    blogId: string;
  }): Promise<void> {
    const foundedPost: BloggerRepositoryPostType | null =
      await this.postQueryRepositorySQL.getPostByIdInternalUse(postId);
    if (!foundedPost) throw new NotFoundException();
    if (foundedPost.blogId !== blogId) {
      throw new ForbiddenException();
    }
  }
}
