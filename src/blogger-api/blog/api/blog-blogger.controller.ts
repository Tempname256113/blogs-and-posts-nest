import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  PostCreateUpdateBloggerApiDTO,
  BlogBloggerApiCreateUpdateDTO,
  BanUserBloggerApiDTO,
} from './models/blog-blogger-api.dto';
import {
  BlogBloggerApiViewModel,
  BlogBloggerApiPaginationViewModel,
  CommentBloggerApiPaginationViewModel,
  BannedUserBloggerApiPaginationViewModel,
} from './models/blog-blogger-api.models';
import { PostApiModel } from '../../../public-api/post/api/models/post-api.models';
import {
  BannedUsersBloggerApiPaginationQueryDTO,
  BlogBloggerApiPaginationQueryDTO,
  CommentBloggerApiPaginationQueryDTO,
} from './models/blog-blogger-api.query-dto';
import { PostApiCreateUpdateDTO } from '../../../public-api/post/api/models/post-api.dto';
import { AccessToken } from '../../../../generic-decorators/access-token.decorator';
import { CommandBus } from '@nestjs/cqrs';
import { CreateBlogCommand } from '../application/use-cases/create-blog.use-case';
import { CreatePostByBlogCommand } from '../application/use-cases/create-post-by-blog.use-case';
import { UpdateBlogCommand } from '../application/use-cases/update-blog.use-case';
import { DeleteBlogCommand } from '../application/use-cases/delete-blog.use-case';
import { BlogBloggerQueryRepository } from '../infrastructure/repositories/blog-blogger.query-repository';
import { UpdatePostByBlogIdCommand } from '../application/use-cases/update-post-by-blogId.use-case';
import { DeletePostByBlogIdCommand } from '../application/use-cases/delete-post-by-blogId.use-case';
import { AccessTokenGuard } from '../../../../generic-guards/access-token.guard';
import { BanUserBloggerApiCommand } from '../application/use-cases/ban-user.blogger-api.use-case';

@Controller('blogger')
export class BlogBloggerController {
  constructor(
    private blogQueryRepository: BlogBloggerQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Post('blogs')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.CREATED)
  async createBlog(
    @Body() blogCreateDTO: BlogBloggerApiCreateUpdateDTO,
    @AccessToken() accessToken: string | null,
  ): Promise<BlogBloggerApiViewModel> {
    const createdBlog: BlogBloggerApiViewModel = await this.commandBus.execute<
      CreateBlogCommand,
      BlogBloggerApiViewModel
    >(
      new CreateBlogCommand({
        createBlogDTO: blogCreateDTO,
        accessToken,
      }),
    );
    return createdBlog;
  }

  @Post('blogs/:blogId/posts')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPostForSpecificBlog(
    @Param('blogId') blogId: string,
    @Body() postCreateDTO: PostCreateUpdateBloggerApiDTO,
    @AccessToken() accessToken: string | null,
  ): Promise<PostApiModel> {
    const mappedCreatePostDTO: PostApiCreateUpdateDTO = {
      title: postCreateDTO.title,
      shortDescription: postCreateDTO.shortDescription,
      content: postCreateDTO.content,
      blogId,
    };
    const createdPost: PostApiModel = await this.commandBus.execute<
      CreatePostByBlogCommand,
      PostApiModel
    >(
      new CreatePostByBlogCommand({
        blogId,
        createPostDTO: mappedCreatePostDTO,
        accessToken,
      }),
    );
    return createdPost;
  }

  @Get('blogs')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  async getBlogsWithPaginationForCurrentUser(
    @Query()
    rawPaginationQuery: BlogBloggerApiPaginationQueryDTO,
    @AccessToken() accessToken: string | null,
  ): Promise<BlogBloggerApiPaginationViewModel> {
    const paginationQuery: BlogBloggerApiPaginationQueryDTO = {
      searchNameTerm: rawPaginationQuery.searchNameTerm ?? null,
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
    const blogsWithPagination: BlogBloggerApiPaginationViewModel =
      await this.blogQueryRepository.getBlogsWithPagination({
        rawPaginationQuery: paginationQuery,
        accessToken,
      });
    return blogsWithPagination;
  }

  @Get('blogs/comments')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  async getAllCommentsFromAllMyPosts(
    @Query() rawPaginationQuery: CommentBloggerApiPaginationQueryDTO,
    @AccessToken() accessToken: string | null,
  ): Promise<CommentBloggerApiPaginationViewModel> {
    const paginationQuery: CommentBloggerApiPaginationQueryDTO = {
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
    const foundedCommentsWithPagination: CommentBloggerApiPaginationViewModel =
      await this.blogQueryRepository.getAllCommentsFromAllPosts({
        paginationQuery,
        accessToken,
      });
    return foundedCommentsWithPagination;
  }

  @Get('users/blog/:blogId')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  async getAllBannedUsersForBlog(
    @Query() rawPaginationQuery: BannedUsersBloggerApiPaginationQueryDTO,
    @Param('blogId') blogId: string,
    @AccessToken() accessToken: string,
  ): Promise<BannedUserBloggerApiPaginationViewModel> {
    const paginationQuery: BannedUsersBloggerApiPaginationQueryDTO = {
      searchLoginTerm: rawPaginationQuery.searchLoginTerm ?? null,
      sortBy: rawPaginationQuery.sortBy ?? 'banDate',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
    };
    const bannedUsersForBlogWithPagination: BannedUserBloggerApiPaginationViewModel =
      await this.blogQueryRepository.getAllBannedUsersForBlog({
        paginationQuery,
        blogId,
      });
    return bannedUsersForBlogWithPagination;
  }

  @Put('blogs/:blogId')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlogById(
    @Param('blogId') blogId: string,
    @Body() blogUpdateDTO: BlogBloggerApiCreateUpdateDTO,
    @AccessToken() accessToken: string | null,
  ): Promise<void> {
    await this.commandBus.execute<UpdateBlogCommand, void>(
      new UpdateBlogCommand({
        blogId,
        updateBlogDTO: blogUpdateDTO,
        accessToken,
      }),
    );
  }

  @Put('users/:userId/ban')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async banUser(
    @Param('userId') bannedUserId: string,
    @Body() banUserBloggerApiDTO: BanUserBloggerApiDTO,
    @AccessToken() accessToken: string | null,
  ): Promise<void> {
    await this.commandBus.execute<BanUserBloggerApiCommand, void>(
      new BanUserBloggerApiCommand({
        bannedUserId,
        isBanned: banUserBloggerApiDTO.isBanned,
        banReason: banUserBloggerApiDTO.banReason,
        blogId: banUserBloggerApiDTO.blogId,
        accessToken,
      }),
    );
  }

  @Put('blogs/:blogId/posts/:postId')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePostById(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() postUpdateDTO: PostCreateUpdateBloggerApiDTO,
    @AccessToken() accessToken: string | null,
  ): Promise<void> {
    await this.commandBus.execute<UpdatePostByBlogIdCommand, void>(
      new UpdatePostByBlogIdCommand({
        blogId,
        postId,
        postUpdateDTO,
        accessToken,
      }),
    );
  }

  @Delete('blogs/:blogId')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlogById(
    @Param('blogId') blogId: string,
    @AccessToken() accessToken: string | null,
  ): Promise<void> {
    await this.commandBus.execute<DeleteBlogCommand, void>(
      new DeleteBlogCommand({ blogId, accessToken }),
    );
  }

  @Delete('blogs/:blogId/posts/:postId')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePostById(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @AccessToken() accessToken: string | null,
  ): Promise<void> {
    await this.commandBus.execute<DeletePostByBlogIdCommand, void>(
      new DeletePostByBlogIdCommand({ postId, blogId, accessToken }),
    );
  }
}
