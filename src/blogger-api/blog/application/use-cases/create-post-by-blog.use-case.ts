import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostApiCreateUpdateDTO } from '../../../../public-api/post/api/models/post-api.dto';
import { PostApiModel } from '../../../../public-api/post/api/models/post-api.models';
import {
  BlogDocument,
  BlogSchema,
} from '../../../../../libs/db/mongoose/schemes/blog.entity';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Post,
  PostDocument,
  PostSchema,
} from '../../../../../libs/db/mongoose/schemes/post.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlogRepository } from '../../infrastructure/repositories/blog.repository';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { BlogPublicQueryRepository } from '../../../../public-api/blog/infrastructure/repositories/blog-public.query-repository';
import { BlogBloggerQueryRepository } from '../../infrastructure/repositories/blog-blogger.query-repository';

export class CreatePostByBlogCommand {
  constructor(
    public readonly data: {
      blogId: string;
      createPostDTO: PostApiCreateUpdateDTO;
      accessToken: string;
    },
  ) {}
}

@CommandHandler(CreatePostByBlogCommand)
export class CreatePostByBlogUseCase
  implements ICommandHandler<CreatePostByBlogCommand, PostApiModel>
{
  constructor(
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    private blogRepository: BlogRepository,
    private blogQueryRepository: BlogBloggerQueryRepository,
    private jwtHelpers: JwtUtils,
  ) {}

  async execute({
    data: { blogId, createPostDTO, accessToken },
  }: CreatePostByBlogCommand): Promise<PostApiModel> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtHelpers.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const foundedBlog: BlogDocument | null =
      await this.blogQueryRepository.getBlogById(blogId);
    if (!foundedBlog) throw new NotFoundException();
    if (foundedBlog.bloggerId !== accessTokenPayload.userId) {
      throw new ForbiddenException();
    }
    const newCreatedPost: Post = foundedBlog.createPost(createPostDTO);
    const newPostModel: PostDocument = new this.PostModel(newCreatedPost);
    await this.blogRepository.saveBlogOrPost(newPostModel);
    const mappedNewPost: PostApiModel = {
      id: newCreatedPost.id,
      title: newCreatedPost.title,
      shortDescription: newCreatedPost.shortDescription,
      content: newCreatedPost.content,
      blogId: newCreatedPost.blogId,
      blogName: newCreatedPost.blogName,
      createdAt: newCreatedPost.createdAt,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      },
    };
    return mappedNewPost;
  }
}
