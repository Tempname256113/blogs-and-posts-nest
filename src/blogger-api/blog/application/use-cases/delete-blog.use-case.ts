import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { BloggerBlogRepositorySql } from '../../infrastructure/repositories/blog-blogger.repository-sql';
import { BloggerBlogQueryRepositorySQL } from '../../infrastructure/repositories/blog-blogger.query-repository-sql';
import { BloggerRepositoryBlogType } from '../../infrastructure/repositories/models/blogger-repository.models';

export class DeleteBlogCommand {
  constructor(
    public readonly data: {
      blogId: string;
      accessToken: string;
    },
  ) {}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase
  implements ICommandHandler<DeleteBlogCommand, void>
{
  constructor(
    private readonly blogRepository: BloggerBlogRepositorySql,
    private readonly blogQueryRepository: BloggerBlogQueryRepositorySQL,
    private readonly jwtUtils: JwtUtils,
  ) {}

  async execute({
    data: { blogId, accessToken },
  }: DeleteBlogCommand): Promise<void> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const foundedBlog: BloggerRepositoryBlogType | null =
      await this.blogQueryRepository.getBlogByIdInternalUse(blogId);
    if (!foundedBlog) throw new NotFoundException();
    if (foundedBlog.bloggerId !== accessTokenPayload.userId) {
      throw new ForbiddenException();
    }
    await this.blogRepository.deleteBlogById(blogId);
  }
}
