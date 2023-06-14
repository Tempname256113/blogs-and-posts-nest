import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogBloggerApiCreateUpdateDTO } from '../../api/models/blog-blogger-api.dto';
import { BlogBloggerApiViewModel } from '../../api/models/blog-blogger-api.models';
import {
  Blog,
  BlogDocument,
  BlogSchema,
} from '../../../../../libs/db/mongoose/schemes/blog.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlogRepository } from '../../infrastructure/repositories/blog.repository';
import { v4 as uuidv4 } from 'uuid';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { UnauthorizedException } from '@nestjs/common';

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
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    private blogRepository: BlogRepository,
    private jwtHelpers: JwtUtils,
  ) {}

  async execute({
    data: { createBlogDTO, accessToken },
  }: CreateBlogCommand): Promise<BlogBloggerApiViewModel> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtHelpers.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const newBlog: Blog = {
      id: uuidv4(),
      bloggerId: accessTokenPayload.userId,
      bloggerLogin: accessTokenPayload.userLogin,
      name: createBlogDTO.name,
      description: createBlogDTO.description,
      websiteUrl: createBlogDTO.websiteUrl,
      createdAt: new Date().toISOString(),
      isMembership: false,
    };
    const mappedBlog: BlogBloggerApiViewModel = {
      id: newBlog.id,
      name: newBlog.name,
      description: newBlog.description,
      websiteUrl: newBlog.websiteUrl,
      createdAt: newBlog.createdAt,
      isMembership: newBlog.isMembership,
    };
    const newBlogModel: BlogDocument = new this.BlogModel(newBlog);
    await this.blogRepository.saveBlogOrPost(newBlogModel);
    return mappedBlog;
  }
}
