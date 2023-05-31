import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Blog,
  BlogSchema,
} from '../../../../../libs/db/mongoose/schemes/blog.entity';
import {
  Post,
  PostSchema,
} from '../../../../../libs/db/mongoose/schemes/post.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtHelpers } from '../../../../../libs/auth/jwt/jwt-helpers.service';

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
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    private jwtHelpers: JwtHelpers,
  ) {}

  async execute({
    data: { blogId, postId, accessToken },
  }: DeletePostByBlogIdCommand): Promise<void> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtHelpers.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const foundedBlog: Blog | null = await this.BlogModel.findOne({
      id: blogId,
    }).lean();
    if (!foundedBlog) throw new NotFoundException();
    if (foundedBlog.bloggerId !== accessTokenPayload.userId) {
      throw new ForbiddenException();
    }
    const foundedPost: Post | null = await this.PostModel.findOne({
      id: postId,
    }).lean();
    if (!foundedPost) throw new NotFoundException();
    if (foundedPost.blogId !== blogId) {
      throw new ForbiddenException();
    }
    await this.PostModel.deleteOne({ id: postId });
  }
}
