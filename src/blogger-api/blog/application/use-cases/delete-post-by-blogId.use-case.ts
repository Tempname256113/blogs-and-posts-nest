import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BlogDocument } from '../../../../../libs/db/mongoose/schemes/blog.entity';
import {
  PostDocument,
  PostSchema,
} from '../../../../../libs/db/mongoose/schemes/post.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { BlogBloggerQueryRepository } from '../../infrastructure/repositories/blog-blogger.query-repository';

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
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    private jwtHelpers: JwtUtils,
    private blogQueryRepository: BlogBloggerQueryRepository,
  ) {}

  async execute({
    data: { blogId, postId, accessToken },
  }: DeletePostByBlogIdCommand): Promise<void> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtHelpers.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const foundedBlog: BlogDocument | null =
      await this.blogQueryRepository.getBlogById(blogId);
    if (!foundedBlog) throw new NotFoundException();
    if (foundedBlog.bloggerId !== accessTokenPayload.userId) {
      throw new ForbiddenException();
    }
    const foundedPost: PostDocument | null =
      await this.blogQueryRepository.getRawPostById(postId);
    if (!foundedPost) throw new NotFoundException();
    if (foundedPost.blogId !== blogId) {
      throw new ForbiddenException();
    }
    await this.PostModel.deleteOne({ id: postId });
  }
}
