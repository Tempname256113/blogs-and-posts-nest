import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostApiCreateUpdateDTO } from '../../../../public-api/post/api/models/post-api.dto';
import { PostViewModel } from '../../../../public-api/post/api/models/post-api.models';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { BloggerPostRepositorySQL } from '../../infrastructure/repositories/post-blogger.repository-sql';
import {
  BloggerRepositoryBlogType,
  BloggerRepositoryCreatedPostType,
} from '../../infrastructure/repositories/models/blogger-repository.models';
import { BloggerBlogQueryRepositorySQL } from '../../infrastructure/repositories/blog-blogger.query-repository-sql';

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
  implements ICommandHandler<CreatePostByBlogCommand, PostViewModel>
{
  constructor(
    private readonly postRepositorySQL: BloggerPostRepositorySQL,
    private readonly blogQueryRepositorySQL: BloggerBlogQueryRepositorySQL,
    private readonly jwtUtils: JwtUtils,
  ) {}

  async execute({
    data: { blogId, createPostDTO, accessToken },
  }: CreatePostByBlogCommand): Promise<PostViewModel> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const foundedBlog: BloggerRepositoryBlogType | null =
      await this.blogQueryRepositorySQL.getBlogByIdInternalUse(blogId);
    if (!foundedBlog) throw new NotFoundException();
    if (foundedBlog.bloggerId !== accessTokenPayload.userId) {
      throw new ForbiddenException();
    }
    const newCreatedPost: BloggerRepositoryCreatedPostType =
      await this.postRepositorySQL.createPost({
        blogId,
        content: createPostDTO.content,
        shortDescription: createPostDTO.shortDescription,
        title: createPostDTO.title,
      });
    const mappedNewPost: PostViewModel = {
      id: String(newCreatedPost.id),
      title: newCreatedPost.title,
      shortDescription: newCreatedPost.shortDescription,
      content: newCreatedPost.content,
      blogId: String(foundedBlog.id),
      blogName: foundedBlog.name,
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
