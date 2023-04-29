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
import { BlogService } from '../../blog-application/blog.service';
import {
  IBlogApiCreatePostDTO,
  IBlogApiCreateUpdateDTO,
} from '../blog-api-models/blog-api.dto';
import {
  BlogApiModelType,
  BlogApiPaginationModelType,
} from '../blog-api-models/blog-api.models';
import { BlogQueryRepository } from '../../blog-infrastructure/blog-repositories/blog.query-repository';
import {
  PostApiModel,
  PostApiPaginationModelType,
} from '../../../post/post-api/post-api-models/post-api.models';
import { BlogApiPaginationQueryDTO } from '../blog-api-models/blog-api.query-dto';
import { PostApiPaginationQueryDTOType } from '../../../post/post-api/post-api-models/post-api.query-dto';
import { IPostApiCreateUpdateDTO } from '../../../post/post-api/post-api-models/post-api.dto';
import { BasicAuthGuard } from '../../../../app-helpers/passport-strategy/auth-basic.strategy';

@Controller('blogs')
export class BlogController {
  constructor(
    private blogService: BlogService,
    private blogQueryRepository: BlogQueryRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(BasicAuthGuard)
  async createBlog(
    @Body() blogCreateDTO: IBlogApiCreateUpdateDTO,
  ): Promise<BlogApiModelType> {
    const createdBlog: BlogApiModelType = await this.blogService.createBlog(
      blogCreateDTO,
    );
    return createdBlog;
  }

  @Post(':blogId/posts')
  @HttpCode(HttpStatus.CREATED)
  async createPostForSpecificBlog(
    @Param('blogId') blogId: string,
    @Body() postCreateDTO: IBlogApiCreatePostDTO,
  ): Promise<PostApiModel> {
    const mappedCreatePostDTO: IPostApiCreateUpdateDTO = {
      title: postCreateDTO.title,
      shortDescription: postCreateDTO.shortDescription,
      content: postCreateDTO.content,
      blogId,
    };
    const createdPost: PostApiModel = await this.blogService.createPost(
      blogId,
      mappedCreatePostDTO,
    );
    return createdPost;
  }

  @Get()
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
  }

  @Get(':blogId/posts')
  @HttpCode(HttpStatus.OK)
  async getPostsWithPaginationByBlogId(
    @Query()
    rawPaginationQuery: PostApiPaginationQueryDTOType,
    @Param('blogId') blogId: string,
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
      await this.blogQueryRepository.getPostsWithPaginationByBlogId(
        paginationQuery,
        blogId,
      );
    return foundedPostsByBlogId;
  }

  @Get(':blogId')
  @HttpCode(HttpStatus.OK)
  async getBlogById(
    @Param('blogId') blogId: string,
  ): Promise<BlogApiModelType> {
    const foundedBlog: BlogApiModelType | null =
      await this.blogQueryRepository.getBlogById(blogId);
    if (!foundedBlog) throw new NotFoundException();
    return foundedBlog;
  }

  @Put(':blogId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BasicAuthGuard)
  async updateBlogById(
    @Param('blogId') blogId: string,
    @Body() blogUpdateDTO: IBlogApiCreateUpdateDTO,
  ): Promise<void> {
    await this.blogService.updateBlog(blogId, blogUpdateDTO);
  }

  @Delete(':blogId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BasicAuthGuard)
  async deleteBlogById(@Param('blogId') blogId: string) {
    await this.blogService.deleteBlog(blogId);
  }
}
