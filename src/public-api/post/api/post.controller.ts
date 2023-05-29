import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostApiCreateUpdateDTO } from './models/post-api.dto';
import { PostQueryRepository } from '../infrastructure/repositories/post.query-repository';
import {
  PostApiModel,
  PostApiPaginationModelType,
} from './models/post-api.models';
import { PostApiPaginationQueryDTOType } from './models/post-api.query-dto';
import { JwtAuthAccessTokenGuard } from '../../../../libs/auth/passport-strategy/auth-jwt-access-token.strategy';
import { AdditionalReqDataDecorator } from '../../../../generic-decorators/additional-req-data.decorator';
import { JwtAccessTokenPayloadType } from '../../../../generic-models/jwt.payload.model';
import { Post as PostType } from '../../../../libs/db/mongoose/schemes/post.entity';
import { CommentApiCreateDto } from '../../comment/api/models/comment-api.dto';
import {
  CommentApiModel,
  CommentApiPaginationModel,
} from '../../comment/api/models/comment-api.models';
import { CommentApiPaginationQueryDto } from '../../comment/api/models/comment-api.query-dto';
import { CommentQueryRepository } from '../../comment/infrastructure/repositories/comment.query-repository';
import { LikeDto } from '../../../product-module/product-models/like.dto';
import { AccessToken } from '../../../../generic-decorators/access-token.decorator';
import { BasicAuthGuard } from '../../../../libs/auth/passport-strategy/auth-basic.strategy';
import { CommandBus } from '@nestjs/cqrs';
import { CreateNewPostCommand } from '../application/use-cases/create-new-post.use-case';
import { CreateNewCommentCommand } from '../application/use-cases/create-new-comment.use-case';
import { UpdatePostCommand } from '../application/use-cases/update-post.use-case';
import { DeletePostCommand } from '../application/use-cases/delete-post.use-case';
import { ChangePostLikeStatusCommand } from '../application/use-cases/change-post-like-status.use-case';

@Controller('posts')
export class PostController {
  constructor(
    private postQueryRepository: PostQueryRepository,
    private commentQueryRepository: CommentQueryRepository,
    private commandBus: CommandBus,
  ) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(BasicAuthGuard)
  async createPost(
    @Body() postCreateDTO: PostApiCreateUpdateDTO,
  ): Promise<PostApiModel> {
    const newPost: PostType = await this.commandBus.execute<
      CreateNewPostCommand,
      PostType
    >(new CreateNewPostCommand(postCreateDTO));
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
    @AccessToken() accessToken: string | null,
  ): Promise<PostApiPaginationModelType> {
    const paginationQuery: PostApiPaginationQueryDTOType = {
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
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
    @AccessToken() accessToken: string | null,
  ): Promise<PostApiModel> {
    const foundedPost: PostApiModel | null =
      await this.postQueryRepository.getPostById(postId, accessToken);
    return foundedPost;
  }

  @Post(':postId/comments')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthAccessTokenGuard)
  async createNewComment(
    @AdditionalReqDataDecorator<JwtAccessTokenPayloadType>()
    accessTokenPayload: JwtAccessTokenPayloadType,
    @Param('postId') postId: string,
    @Body() { content }: CommentApiCreateDto,
  ): Promise<CommentApiModel> {
    const newComment: CommentApiModel = await this.commandBus.execute<
      CreateNewCommentCommand,
      CommentApiModel
    >(
      new CreateNewCommentCommand({
        postId,
        content,
        userId: accessTokenPayload.userId,
        userLogin: accessTokenPayload.userLogin,
      }),
    );
    return newComment;
  }

  @Get(':postId/comments')
  @HttpCode(HttpStatus.OK)
  async getCommentsWithPaginationByPostId(
    @Param('postId') postId: string,
    @Query()
    rawPaginationQuery: CommentApiPaginationQueryDto,
    @AccessToken() accessToken: string | null,
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
      await this.commentQueryRepository.getCommentsWithPaginationByPostId({
        paginationQuery,
        postId,
        accessToken,
      });
    return commentsWithPagination;
  }

  @Put(':postId/like-status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthAccessTokenGuard)
  async changeLikeStatus(
    @Param('postId') postId: string,
    @Body() { likeStatus }: LikeDto,
    @AdditionalReqDataDecorator<JwtAccessTokenPayloadType>()
    accessTokenPayload: JwtAccessTokenPayloadType,
  ): Promise<void> {
    await this.commandBus.execute<ChangePostLikeStatusCommand, void>(
      new ChangePostLikeStatusCommand({
        postId,
        likeStatus,
        userId: accessTokenPayload.userId,
        userLogin: accessTokenPayload.userLogin,
      }),
    );
  }

  @Put(':postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BasicAuthGuard)
  async updatePost(
    @Param('postId') postId: string,
    @Body() postUpdateDTO: PostApiCreateUpdateDTO,
  ): Promise<void> {
    await this.commandBus.execute<UpdatePostCommand, void>(
      new UpdatePostCommand({ postId, postUpdateDTO }),
    );
  }

  @Delete(':postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BasicAuthGuard)
  async deletePost(@Param('postId') postId: string): Promise<void> {
    await this.commandBus.execute<DeletePostCommand, void>(
      new DeletePostCommand(postId),
    );
  }
}
