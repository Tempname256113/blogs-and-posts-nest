import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IPostApiCreateUpdateDTO } from '../post-api-models/post-api.dto';
import { PostService } from '../post-application/post.service';
import { PostQueryRepository } from '../../post-infrastructure/post-repositories/post.query-repository';
import {
  PostApiModel,
  PostApiPaginationModelType,
} from '../post-api-models/post-api.models';
import { PostApiPaginationQueryDTOType } from '../post-api-models/post-api.query-dto';
import { JwtAuthGuard } from '../../../../app-helpers/passport-strategy/auth-jwt.strategy';
import { AdditionalReqDataDecorator } from '../../../../app-helpers/decorators/additional-req-data.decorator';
import { JwtAccessTokenPayloadType } from '../../../../app-models/jwt.payload.model';
import { Post as PostType } from '../../../product-domain/post.entity';
import { CommentApiCreateDto } from '../../../comment/comment-api/comment-api-models/comment-api.dto';
import {
  CommentApiModel,
  CommentApiPaginationModel,
} from '../../../comment/comment-api/comment-api-models/comment-api.models';
import { CommentApiPaginationQueryDto } from '../../../comment/comment-api/comment-api-models/comment-api.query-dto';
import { CommentQueryRepository } from '../../../comment/comment-infrastructure/comment-repositories/comment.query-repository';
import { LikeDto } from '../../../product-models/like.dto';
import { HeadersEnum } from '../../../../app-helpers/enums/headers.enum';

@Controller('posts')
export class PostController {
  constructor(
    private postService: PostService,
    private postQueryRepository: PostQueryRepository,
    private commentQueryRepository: CommentQueryRepository,
  ) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPost(
    @Body() postCreateDTO: IPostApiCreateUpdateDTO,
  ): Promise<PostApiModel> {
    const newPost: PostType = await this.postService.createNewPost(
      postCreateDTO,
    );
    const postApiModel: PostApiModel = {
      id: newPost.id,
      title: newPost.title,
      shortDescription: newPost.shortDescription,
      content: newPost.content,
      blogId: newPost.blogId,
      blogName: newPost.blogName,
      createdAt: newPost.createdAt,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      },
    };
    return postApiModel;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getPostsWithPagination(
    @Query()
    rawPaginationQuery: PostApiPaginationQueryDTOType,
    @Headers(HeadersEnum.AUTHORIZATION_PROPERTY) accessToken: string | null,
  ): Promise<PostApiPaginationModelType> {
    const paginationQuery: PostApiPaginationQueryDTOType = {
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
    if (accessToken) {
      accessToken = accessToken.split(' ')[1];
      if (!accessToken) {
        accessToken = null;
      }
    } else {
      accessToken = null;
    }
    const postsWithPagination: PostApiPaginationModelType =
      await this.postQueryRepository.getPostsWithPagination(
        paginationQuery,
        accessToken,
      );
    return postsWithPagination;
  }

  @Get(':postId')
  @HttpCode(HttpStatus.OK)
  async getPostById(
    @Param('postId') postId: string,
    @Headers(HeadersEnum.AUTHORIZATION_PROPERTY) accessToken: string | null,
  ): Promise<PostApiModel> {
    if (accessToken) {
      accessToken = accessToken.split(' ')[1];
      if (!accessToken) {
        accessToken = null;
      }
    } else {
      accessToken = null;
    }
    const foundedPost: PostApiModel | null =
      await this.postQueryRepository.getPostById(postId, accessToken);
    return foundedPost;
  }

  @Post(':postId/comments')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async createNewComment(
    @AdditionalReqDataDecorator<JwtAccessTokenPayloadType>()
    accessTokenPayload: JwtAccessTokenPayloadType,
    @Param('postId') postId: string,
    @Body() { content }: CommentApiCreateDto,
  ): Promise<CommentApiModel> {
    const newComment: CommentApiModel = await this.postService.createNewComment(
      {
        postId,
        content,
        userId: accessTokenPayload.userId,
        userLogin: accessTokenPayload.userLogin,
      },
    );
    return newComment;
  }

  @Get(':postId/comments')
  @HttpCode(HttpStatus.OK)
  async getCommentsWithPaginationByPostId(
    @Param('postId') postId: string,
    @Query()
    rawPaginationQuery: CommentApiPaginationQueryDto,
  ): Promise<CommentApiPaginationModel> {
    const paginationQuery: CommentApiPaginationQueryDto = {
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
    const foundedPost: PostApiModel | null =
      await this.postQueryRepository.getPostById(postId, null);
    if (!foundedPost) throw new NotFoundException();
    const commentsWithPagination: CommentApiPaginationModel =
      await this.commentQueryRepository.getCommentsWithPagination({
        paginationQuery,
        postId,
      });
    return commentsWithPagination;
  }

  @Put(':postId/like-status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async changeLikeStatus(
    @Param('postId') postId: string,
    @Body() { likeStatus }: LikeDto,
    @AdditionalReqDataDecorator<JwtAccessTokenPayloadType>()
    accessTokenPayload: JwtAccessTokenPayloadType,
  ): Promise<void> {
    await this.postService.changeLikeStatus({
      postId,
      likeStatus,
      userId: accessTokenPayload.userId,
      userLogin: accessTokenPayload.userLogin,
    });
  }

  @Put(':postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('postId') postId: string,
    @Body() postUpdateDTO: IPostApiCreateUpdateDTO,
  ): Promise<void> {
    await this.postService.updatePost(postId, postUpdateDTO);
  }

  @Delete(':postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('postId') postId: string): Promise<void> {
    await this.postService.deletePost(postId);
  }
}
