import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostCreateUpdateBloggerApiDTO } from '../../api/models/blog-blogger-api.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  PostDocument,
  PostSchema,
} from '../../../../../libs/db/mongoose/schemes/post.entity';
import { Model } from 'mongoose';
import {
  Blog,
  BlogSchema,
} from '../../../../../libs/db/mongoose/schemes/blog.entity';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BlogBloggerQueryRepository } from '../../infrastructure/repositories/blog-blogger.query-repository';

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
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    private jwtHelpers: JwtUtils,
    private blogQueryRepository: BlogBloggerQueryRepository,
  ) {}

  async execute({
    data: { blogId, postId, postUpdateDTO, accessToken },
  }: UpdatePostByBlogIdCommand): Promise<void> {
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
    const foundedPost: PostDocument | null =
      await this.blogQueryRepository.getRawPostById(postId);
    if (!foundedPost) throw new NotFoundException();
    if (foundedPost.blogId !== blogId) {
      throw new ForbiddenException();
    }
    await this.PostModel.updateOne({ id: postId }, postUpdateDTO);
  }
}
