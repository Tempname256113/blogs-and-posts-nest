import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostCreateUpdateBloggerApiDTO } from '../../api/models/blog-blogger-api.dto';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  BloggerRepositoryBlogType,
  BloggerRepositoryPostType,
} from '../../infrastructure/repositories/models/blogger-repository.models';
import { BloggerBlogQueryRepositorySQL } from '../../infrastructure/repositories/blog-blogger.query-repository-sql';
import { BloggerPostQueryRepositorySQL } from '../../infrastructure/repositories/post-blogger.query-repository-sql';
import { BloggerPostRepositorySQL } from '../../infrastructure/repositories/post-blogger.repository-sql';

export class UpdatePostByBlogIdCommand {
  constructor(
    public readonly data: {
      blogId: string;
      postId: string;
      postUpdateDTO: PostCreateUpdateBloggerApiDTO;
      accessToken: string;
    },
  ) {}
}

@CommandHandler(UpdatePostByBlogIdCommand)
export class UpdatePostByBlogIdUseCase
  implements ICommandHandler<UpdatePostByBlogIdCommand, void>
{
  constructor(
    private jwtUtils: JwtUtils,
    private readonly blogQueryRepositorySQL: BloggerBlogQueryRepositorySQL,
    private readonly postQueryRepositorySQL: BloggerPostQueryRepositorySQL,
    private readonly postRepositorySQL: BloggerPostRepositorySQL,
  ) {}

  async execute({
    data: { blogId, postId, postUpdateDTO, accessToken },
  }: UpdatePostByBlogIdCommand): Promise<void> {
    const accessTokenPayload: JwtAccessTokenPayloadType =
      this.getAccessTokenPayload(accessToken);
    await this.checkBlogOwner({ accessTokenPayload, blogId });
    await this.checkPostOwner({ postId, blogId });
    await this.postRepositorySQL.updatePostById({
      postId,
      title: postUpdateDTO.title,
      shortDescription: postUpdateDTO.shortDescription,
      content: postUpdateDTO.content,
    });
  }

  getAccessTokenPayload(accessToken: string): JwtAccessTokenPayloadType {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    return accessTokenPayload;
  }

  async checkBlogOwner({
    accessTokenPayload,
    blogId,
  }: {
    accessTokenPayload: JwtAccessTokenPayloadType;
    blogId: string;
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
