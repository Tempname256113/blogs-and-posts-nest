import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogBloggerApiCreateUpdateDTO } from '../../api/models/blog-blogger-api.dto';
import { BlogBloggerApiViewModel } from '../../api/models/blog-blogger-api.models';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { UnauthorizedException } from '@nestjs/common';
import { BloggerRepositoryCreatedBlogType } from '../../infrastructure/repositories/models/blogger-repository.models';
import { BloggerBlogRepositorySql } from '../../infrastructure/repositories/blog-blogger.repository-sql';

export class CreateBlogCommand {
  constructor(
    public readonly data: {
      createBlogDTO: BlogBloggerApiCreateUpdateDTO;
      accessToken: string;
    },
  ) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase
  implements ICommandHandler<CreateBlogCommand, BlogBloggerApiViewModel>
{
  constructor(
    private readonly blogRepositorySQL: BloggerBlogRepositorySql,
    private jwtUtils: JwtUtils,
  ) {}

  async execute({
    data: { createBlogDTO, accessToken },
  }: CreateBlogCommand): Promise<BlogBloggerApiViewModel> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const createdBlog: BloggerRepositoryCreatedBlogType =
      await this.blogRepositorySQL.createBlog({
        bloggerId: accessTokenPayload.userId,
        name: createBlogDTO.name,
        description: createBlogDTO.description,
        websiteUrl: createBlogDTO.websiteUrl,
      });
    const mappedBlog: BlogBloggerApiViewModel = {
      id: createdBlog.id,
      name: createBlogDTO.name,
      description: createBlogDTO.description,
      websiteUrl: createBlogDTO.websiteUrl,
      createdAt: createdBlog.createdAt,
      isMembership: createdBlog.isMembership,
    };
    return mappedBlog;
  }
}
