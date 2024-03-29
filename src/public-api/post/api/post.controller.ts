import {
  Body,
  Controller,
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
import {
  PostViewModel,
  PostPaginationViewModel,
} from './models/post-api.models';
import { PostApiPaginationQueryDTO } from './models/post-api.query-dto';
import { CommentApiCreateDto } from '../../comment/api/models/comment-api.dto';
import {
  CommentViewModel,
  CommentPaginationViewModel,
} from '../../comment/api/models/comment-api.models';
import { CommentApiPaginationQueryDto } from '../../comment/api/models/comment-api.query-dto';
import { ReqAccessToken } from '../../../../generic-decorators/access-token.decorator';
import { CommandBus } from '@nestjs/cqrs';
import { CreateNewCommentCommand } from '../application/use-cases/create-new-comment.use-case';
import { ChangePostLikeStatusCommand } from '../application/use-cases/change-post-like-status.use-case';
import { AccessTokenGuard } from '../../../../generic-guards/access-token.guard';
import { PublicPostQueryRepositorySQL } from '../infrastructure/repositories/post-public.query-repository-sql';
import { PublicCommentQueryRepositorySQL } from '../../comment/infrastructure/repositories/comment-public.query-repository-sql';
import { LikeDto } from '../../like/api/models/like.dto';

@Controller('posts')
export class PostController {
  constructor(
    private readonly postsQueryRepositorySQL: PublicPostQueryRepositorySQL,
    private readonly commentsQueryRepositorySQL: PublicCommentQueryRepositorySQL,
    private commandBus: CommandBus,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getPostsWithPagination(
    @Query()
    rawPaginationQuery: PostApiPaginationQueryDTO,
    @ReqAccessToken() accessToken: string | null,
  ): Promise<PostPaginationViewModel> {
    const paginationQuery: PostApiPaginationQueryDTO = {
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
    const postsWithPagination: PostPaginationViewModel =
      await this.postsQueryRepositorySQL.getPostsWithPagination({
        paginationQuery,
        accessToken,
      });
    return postsWithPagination;
  }

  @Get(':postId')
  @HttpCode(HttpStatus.OK)
  async getPostById(
    @Param('postId') postId: string,
    @ReqAccessToken() accessToken: string | null,
  ): Promise<PostViewModel> {
    const foundedPost: PostViewModel | null =
      await this.postsQueryRepositorySQL.getPostById({ postId, accessToken });
    if (!foundedPost) throw new NotFoundException();
    return foundedPost;
  }

  @Post(':postId/comments')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.CREATED)
  async createNewComment(
    @ReqAccessToken() accessToken: string | null,
    @Param('postId') postId: string,
    @Body() { content }: CommentApiCreateDto,
  ): Promise<CommentViewModel> {
    const newComment: CommentViewModel = await this.commandBus.execute<
      CreateNewCommentCommand,
      CommentViewModel
    >(
      new CreateNewCommentCommand({
        postId,
        content,
        accessToken,
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
    @ReqAccessToken() accessToken: string | null,
  ): Promise<CommentPaginationViewModel> {
    const paginationQuery: CommentApiPaginationQueryDto = {
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
    const foundedPost: PostViewModel | null =
      await this.postsQueryRepositorySQL.getPostById({
        postId,
        accessToken: null,
      });
    if (!foundedPost) throw new NotFoundException();
    const commentsWithPagination: CommentPaginationViewModel =
      await this.commentsQueryRepositorySQL.getAllCommentsForSpecifiedPost({
        paginationQuery,
        postId,
        accessToken,
      });
    return commentsWithPagination;
  }

  @Put(':postId/like-status')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeLikeStatus(
    @Param('postId') postId: string,
    @Body() { likeStatus }: LikeDto,
    @ReqAccessToken() accessToken: string | null,
  ): Promise<void> {
    await this.commandBus.execute<ChangePostLikeStatusCommand, void>(
      new ChangePostLikeStatusCommand({
        postId,
        likeStatus,
        accessToken,
      }),
    );
  }
}
