import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  BlogDocument,
  BlogSchema,
} from '../../../../../libs/db/mongoose/schemes/blog.entity';
import { Model } from 'mongoose';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { BlogBloggerQueryRepository } from '../../infrastructure/repositories/blog-blogger.query-repository';

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
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    private jwtHelpers: JwtUtils,
    private blogQueryRepository: BlogBloggerQueryRepository,
  ) {}

  async execute({
    data: { blogId, accessToken },
  }: DeleteBlogCommand): Promise<void> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtHelpers.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const foundedBlog: BlogDocument | null =
      await this.blogQueryRepository.getBlogById(blogId);
    if (!foundedBlog) throw new NotFoundException();
    if (foundedBlog.bloggerId !== accessTokenPayload.userId) {
      throw new ForbiddenException();
    }
    await this.BlogModel.deleteOne({ id: blogId });
  }
}
