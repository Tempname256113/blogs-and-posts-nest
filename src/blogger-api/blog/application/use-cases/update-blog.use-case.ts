import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogBloggerApiCreateUpdateDTO } from '../../api/models/blog-blogger-api.dto';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { BloggerBlogQueryRepositorySQL } from '../../infrastructure/repositories/blog-blogger.query-repository-sql';
import { BloggerBlogRepositorySql } from '../../infrastructure/repositories/blog-blogger.repository-sql';
import { BloggerRepositoryBlogType } from '../../infrastructure/repositories/models/blogger-repository.models';

export class UpdateBlogCommand {
  constructor(
    public readonly data: {
      blogId: string;
      updateBlogDTO: BlogBloggerApiCreateUpdateDTO;
      accessToken: string;
    },
  ) {}
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase
  implements ICommandHandler<UpdateBlogCommand, void>
{
  constructor(
    private readonly blogQueryRepositorySQL: BloggerBlogQueryRepositorySQL,
    private readonly blogRepositorySQL: BloggerBlogRepositorySql,
    private readonly jwtUtils: JwtUtils,
  ) {}

  async execute({
    data: { blogId, updateBlogDTO, accessToken },
  }: UpdateBlogCommand): Promise<void> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const foundedBlog: BloggerRepositoryBlogType | null =
      await this.blogQueryRepositorySQL.getBlogByIdInternalUse(blogId);
    if (!foundedBlog) throw new NotFoundException();
    if (foundedBlog.bloggerId !== accessTokenPayload.userId) {
      throw new ForbiddenException();
    }
    await this.blogRepositorySQL.updateBlog({
      blogId,
      name: updateBlogDTO.name,
      description: updateBlogDTO.description,
      websiteUrl: updateBlogDTO.websiteUrl,
    });
  }
}
