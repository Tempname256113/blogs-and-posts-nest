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
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  BlogBloggerApiCreatePostDTO,
  BlogBloggerApiCreateUpdateDTO,
} from './models/blog-blogger-api.dto';
import {
  BlogBloggerApiModel,
  BlogBloggerApiPaginationModel,
} from './models/blog-blogger-api.models';
import {
  PostApiModel,
  PostApiPaginationModelType,
} from '../../../public-api/post/api/models/post-api.models';
import { BlogBloggerApiPaginationQueryDTO } from './models/blog-blogger-api.query-dto';
import { PostApiPaginationQueryDTOType } from '../../../public-api/post/api/models/post-api.query-dto';
import { PostApiCreateUpdateDTO } from '../../../public-api/post/api/models/post-api.dto';
import { BasicAuthGuard } from '../../../../libs/auth/passport-strategy/auth-basic.strategy';
import { AccessToken } from '../../../../generic-decorators/access-token.decorator';
import { CommandBus } from '@nestjs/cqrs';
import { CreateBlogCommand } from '../application/use-cases/create-blog.use-case';
import { CreatePostByBlogCommand } from '../application/use-cases/create-post-by-blog.use-case';
import { UpdateBlogCommand } from '../application/use-cases/update-blog.use-case';
import { DeleteBlogCommand } from '../application/use-cases/delete-blog.use-case';
import { BlogBloggerQueryRepository } from '../infrastructure/repositories/blog-blogger.query-repository';
import { JwtAuthAccessTokenGuard } from '../../../../libs/auth/passport-strategy/auth-jwt-access-token.strategy';
import { PassportjsReqDataDecorator } from '../../../../generic-decorators/passportjs-req-data.decorator';
import { JwtAccessTokenPayloadType } from '../../../../generic-models/jwt.payload.model';

@Controller('blogger/blogs')
export class BlogBloggerController {
  constructor(
    private blogQueryRepository: BlogBloggerQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Post()
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
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(BasicAuthGuard)
  async createPostForSpecificBlog(
    @Param('blogId') blogId: string,
    @Body() postCreateDTO: BlogBloggerApiCreatePostDTO,
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

  @Get()
  @HttpCode(HttpStatus.OK)
  async getBlogsWithPagination(
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
        paginationQuery,
        accessToken,
      });
    return blogsWithPagination;
  }

  @Get(':blogId/posts')
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
  }

  @Get(':blogId')
  @HttpCode(HttpStatus.OK)
  async getBlogById(
    @Param('blogId') blogId: string,
  ): Promise<BlogBloggerApiModel> {
    const foundedBlog: BlogBloggerApiModel | null =
      await this.blogQueryRepository.getBlogById(blogId);
    if (!foundedBlog) throw new NotFoundException();
    return foundedBlog;
  }

  @Put(':blogId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BasicAuthGuard)
  async updateBlogById(
    @Param('blogId') blogId: string,
    @Body() blogUpdateDTO: BlogBloggerApiCreateUpdateDTO,
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
