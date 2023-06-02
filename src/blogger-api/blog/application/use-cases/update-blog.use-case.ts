import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogBloggerApiCreateUpdateDTO } from '../../api/models/blog-blogger-api.dto';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtHelpers } from '../../../../../libs/auth/jwt/jwt-helpers.service';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { InjectModel } from '@nestjs/mongoose';
import {
  Blog,
  BlogSchema,
} from '../../../../../libs/db/mongoose/schemes/blog.entity';
import { Model } from 'mongoose';
import { BlogBloggerQueryRepository } from '../../infrastructure/repositories/blog-blogger.query-repository';

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
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    private jwtHelpers: JwtHelpers,
    private blogQueryRepository: BlogBloggerQueryRepository,
  ) {}

  async execute({
    data: { blogId, updateBlogDTO, accessToken },
  }: UpdateBlogCommand): Promise<void> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtHelpers.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const foundedBlog: Blog | null = await this.blogQueryRepository.getBlogById(
      blogId,
    );
    if (!foundedBlog) throw new NotFoundException();
    if (foundedBlog.bloggerId !== accessTokenPayload.userId) {
      throw new ForbiddenException();
    }
    await this.BlogModel.updateOne({ id: blogId }, updateBlogDTO);
  }
}
