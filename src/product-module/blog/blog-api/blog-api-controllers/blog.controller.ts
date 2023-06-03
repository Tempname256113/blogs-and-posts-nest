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
import {
  BlogApiCreatePostDTO,
  BlogApiCreateUpdateDTO,
} from '../blog-api-models/blog-api.dto';
import {
  BlogApiModelType,
  BlogApiPaginationModelType,
} from '../blog-api-models/blog-api.models';
import { BlogPublicQueryRepository } from '../../../../public-api/blog/infrastructure/repositories/blog-public.query-repository';
import {
  PostApiModel,
  PostApiPaginationModelType,
} from '../../../../public-api/post/api/models/post-api.models';
import { BlogApiPaginationQueryDTO } from '../blog-api-models/blog-api.query-dto';
import { PostApiPaginationQueryDTO } from '../../../../public-api/post/api/models/post-api.query-dto';
import { PostApiCreateUpdateDTO } from '../../../../public-api/post/api/models/post-api.dto';
import { BasicAuthGuard } from '../../../../../libs/auth/passport-strategy/auth-basic.strategy';
import { AccessToken } from '../../../../../generic-decorators/access-token.decorator';
import { CommandBus } from '@nestjs/cqrs';
import { CreateBlogCommand } from '../../blog-application/blog-application-use-cases/create-blog.use-case';
import { CreatePostByBlogCommand } from '../../blog-application/blog-application-use-cases/create-post-by-blog.use-case';
import { UpdateBlogCommand } from '../../blog-application/blog-application-use-cases/update-blog.use-case';
import { DeleteBlogCommand } from '../../blog-application/blog-application-use-cases/delete-blog.use-case';

@Controller('blogs')
export class BlogController {
  constructor(
    private blogQueryRepository: BlogPublicQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(BasicAuthGuard)
  async createBlog(
    @Body() blogCreateDTO: BlogApiCreateUpdateDTO,
  ): Promise<BlogApiModelType> {
    const createdBlog: BlogApiModelType = await this.commandBus.execute<
      CreateBlogCommand,
      BlogApiModelType
    >(new CreateBlogCommand(blogCreateDTO));
    return createdBlog;
  }

  @Post(':blogId/posts')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(BasicAuthGuard)
  async createPostForSpecificBlog(
    @Param('blogId') blogId: string,
    @Body() postCreateDTO: BlogApiCreatePostDTO,
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
      }),
    );
    return createdPost;
  }

  /*@Get()
  @HttpCode(HttpStatus.OK)
  async getBlogsWithPagination(
    @Query()
    rawPaginationQuery: BlogApiPaginationQueryDTO,
  ): Promise<BlogApiPaginationModelType> {
    const paginationQuery: BlogApiPaginationQueryDTO = {
      searchNameTerm: rawPaginationQuery.searchNameTerm ?? null,
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
    const blogsWithPagination: BlogApiPaginationModelType =
      await this.blogQueryRepository.getBlogsWithPagination(paginationQuery);
    return blogsWithPagination;
  }*/

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
    const foundedBlog: BlogApiModelType | null =
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
  ): Promise<BlogApiModelType> {
    const foundedBlog: BlogApiModelType | null =
      await this.blogQueryRepository.getBlogById(blogId);
    if (!foundedBlog) throw new NotFoundException();
    return foundedBlog;
  }*/

  @Put(':blogId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BasicAuthGuard)
  async updateBlogById(
    @Param('blogId') blogId: string,
    @Body() blogUpdateDTO: BlogApiCreateUpdateDTO,
  ): Promise<void> {
    await this.commandBus.execute<UpdateBlogCommand, void>(
      new UpdateBlogCommand({ blogId, updateBlogDTO: blogUpdateDTO }),
    );
  }

  @Delete(':blogId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BasicAuthGuard)
  async deleteBlogById(@Param('blogId') blogId: string) {
    await this.commandBus.execute<DeleteBlogCommand, void>(
      new DeleteBlogCommand(blogId),
    );
  }
}
