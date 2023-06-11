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
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  BloggerApiCreateUpdatePostDTO,
  BlogBloggerApiCreateUpdateDTO,
} from './models/blog-blogger-api.dto';
import {
  BlogBloggerApiModel,
  BlogBloggerApiPaginationModel,
  CommentBloggerApiPaginationModel,
} from './models/blog-blogger-api.models';
import { PostApiModel } from '../../../public-api/post/api/models/post-api.models';
import {
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

@Controller('blogger/blogs')
export class BlogBloggerController {
  constructor(
    private blogQueryRepository: BlogBloggerQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.CREATED)
  async createBlog(
    @Body() blogCreateDTO: BlogBloggerApiCreateUpdateDTO,
    @AccessToken() accessToken: string | null,
  ): Promise<BlogBloggerApiModel> {
    if (!accessToken) throw new UnauthorizedException();
    const createdBlog: BlogBloggerApiModel = await this.commandBus.execute<
      CreateBlogCommand,
      BlogBloggerApiModel
    >(
      new CreateBlogCommand({
        createBlogDTO: blogCreateDTO,
        accessToken,
      }),
    );
    return createdBlog;
  }

  @Post(':blogId/posts')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPostForSpecificBlog(
    @Param('blogId') blogId: string,
    @Body() postCreateDTO: BloggerApiCreateUpdatePostDTO,
    @AccessToken() accessToken: string | null,
  ): Promise<PostApiModel> {
    if (!accessToken) throw new UnauthorizedException();
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

  @Get()
  @HttpCode(HttpStatus.OK)
  async getBlogsWithPaginationForCurrentUser(
    @Query()
    rawPaginationQuery: BlogBloggerApiPaginationQueryDTO,
    @AccessToken() accessToken: string | null,
  ): Promise<BlogBloggerApiPaginationModel> {
    if (!accessToken) throw new UnauthorizedException();
    const paginationQuery: BlogBloggerApiPaginationQueryDTO = {
      searchNameTerm: rawPaginationQuery.searchNameTerm ?? null,
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
    const blogsWithPagination: BlogBloggerApiPaginationModel =
      await this.blogQueryRepository.getBlogsWithPagination({
        rawPaginationQuery: paginationQuery,
        accessToken,
      });
    return blogsWithPagination;
  }

  @Get('comments')
  @HttpCode(HttpStatus.OK)
  async getAllCommentsFromAllMyPosts(
    @Query() rawPaginationQuery: CommentBloggerApiPaginationQueryDTO,
    @AccessToken() accessToken: string | null,
  ): Promise<CommentBloggerApiPaginationModel> {
    if (!accessToken) {
      throw new UnauthorizedException();
    }
    const paginationQuery: CommentBloggerApiPaginationQueryDTO = {
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
    const foundedCommentsWithPagination: CommentBloggerApiPaginationModel =
      await this.blogQueryRepository.getAllCommentsFromAllPosts({
        paginationQuery,
        accessToken,
      });
    return foundedCommentsWithPagination;
  }

  /*@Get(':blogId/posts')
  @HttpCode(HttpStatus.OK)
  async getPostsWithPaginationByBlogId(
    @Query()
    rawPaginationQuery: PostApiPaginationQueryDTOType,
    @Param('blogId') blogId: string,
    @AccessToken() accessToken: string | null,
  ): Promise<PostApiPaginationModelType> {
    const paginationQuery: PostApiPaginationQueryDTOType = {
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
    const foundedBlog: BlogBloggerApiModel | null =
      await this.blogQueryRepository.getBlogById(blogId);
    if (!foundedBlog) throw new NotFoundException();
    const foundedPostsByBlogId: PostApiPaginationModelType =
      await this.blogQueryRepository.getPostsWithPaginationByBlogId({
        rawPaginationQuery: paginationQuery,
        blogId,
        accessToken,
      });
    return foundedPostsByBlogId;
  }*/

  /*@Get(':blogId')
  @HttpCode(HttpStatus.OK)
  async getBlogById(
    @Param('blogId') blogId: string,
  ): Promise<BlogBloggerApiModel> {
    const foundedBlog: BlogBloggerApiModel | null =
      await this.blogQueryRepository.getBlogById(blogId);
    if (!foundedBlog) throw new NotFoundException();
    return foundedBlog;
  }*/

  @Put(':blogId')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlogById(
    @Param('blogId') blogId: string,
    @Body() blogUpdateDTO: BlogBloggerApiCreateUpdateDTO,
    @AccessToken() accessToken: string | null,
  ): Promise<void> {
    if (!accessToken) throw new UnauthorizedException();
    await this.commandBus.execute<UpdateBlogCommand, void>(
      new UpdateBlogCommand({
        blogId,
        updateBlogDTO: blogUpdateDTO,
        accessToken,
      }),
    );
  }

  @Put(':blogId/posts/:postId')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePostById(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() postUpdateDTO: BloggerApiCreateUpdatePostDTO,
    @AccessToken() accessToken: string,
  ): Promise<void> {
    if (!accessToken) throw new UnauthorizedException();
    await this.commandBus.execute<UpdatePostByBlogIdCommand, void>(
      new UpdatePostByBlogIdCommand({
        blogId,
        postId,
        postUpdateDTO,
        accessToken,
      }),
    );
  }

  @Delete(':blogId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlogById(
    @Param('blogId') blogId: string,
    @AccessToken() accessToken: string | null,
  ): Promise<void> {
    if (!accessToken) throw new UnauthorizedException();
    await this.commandBus.execute<DeleteBlogCommand, void>(
      new DeleteBlogCommand({ blogId, accessToken }),
    );
  }

  @Delete(':blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePostById(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @AccessToken() accessToken: string | null,
  ): Promise<void> {
    if (!accessToken) throw new UnauthorizedException();
    await this.commandBus.execute<DeletePostByBlogIdCommand, void>(
      new DeletePostByBlogIdCommand({ postId, blogId, accessToken }),
    );
  }
}
