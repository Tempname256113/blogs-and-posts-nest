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
} from '@nestjs/common';
import { BlogService } from '../../blog-application/blog.service';
import {
  IBlogApiCreatePostDTO,
  IBlogApiCreateUpdateDTO,
} from '../blog-api-models/blog-api.dto';
import {
  IBlogApiModel,
  IBlogApiPaginationModel,
} from '../blog-api-models/blog-api.models';
import { BlogQueryRepository } from '../../blog-infrastructure/blog-repositories/blog.query-repository';
import {
  PostApiModelType,
  PostApiPaginationModelType,
} from '../../../post/post-api/post-api-models/post-api.models';
import { IBlogApiPaginationQueryDTO } from '../blog-api-models/blog-api.query-dto';
import { PostApiPaginationQueryDTO } from '../../../post/post-api/post-api-models/post-api.query-dto';

@Controller('blogs')
export class BlogController {
  constructor(
    private blogService: BlogService,
    private blogQueryRepository: BlogQueryRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBlog(
    @Body() blogCreateDTO: IBlogApiCreateUpdateDTO,
  ): Promise<IBlogApiModel> {
    const createdBlog: IBlogApiModel = await this.blogService.createBlog(
      blogCreateDTO,
    );
    return createdBlog;
  }

  @Post(':blogId/posts')
  @HttpCode(HttpStatus.CREATED)
  async createPostForSpecificBlog(
    @Param('blogId') blogId: string,
    @Body() postCreateDTO: IBlogApiCreatePostDTO,
  ): Promise<PostApiModelType> {
    const createdPost: PostApiModelType | null =
      await this.blogService.createPost(blogId, postCreateDTO);
    if (!createdPost) throw new NotFoundException();
    return createdPost;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getBlogsWithPagination(
    @Query()
    rawPaginationQuery: IBlogApiPaginationQueryDTO,
  ): Promise<IBlogApiPaginationModel> {
    const paginationQuery: IBlogApiPaginationQueryDTO = {
      searchNameTerm: rawPaginationQuery.searchNameTerm ?? null,
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
    const blogsWithPagination: IBlogApiPaginationModel =
      await this.blogQueryRepository.getBlogsWithPagination(paginationQuery);
    return blogsWithPagination;
  }

  @Get(':blogId/posts')
  @HttpCode(HttpStatus.OK)
  async getPostsWithPaginationByBlogId(
    @Query()
    rawPaginationQuery: PostApiPaginationQueryDTO,
    @Param('blogId') blogId: string,
  ): Promise<PostApiPaginationModelType> {
    const paginationQuery: PostApiPaginationQueryDTO = {
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
    const foundedBlog: IBlogApiModel | null =
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
  async getBlogById(@Param('blogId') blogId: string): Promise<IBlogApiModel> {
    const foundedBlog: IBlogApiModel | null =
      await this.blogQueryRepository.getBlogById(blogId);
    if (!foundedBlog) throw new NotFoundException();
    return foundedBlog;
  }

  @Put(':blogId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlogById(
    @Param('blogId') blogId: string,
    @Body() blogUpdateDTO: IBlogApiCreateUpdateDTO,
  ): Promise<void> {
    const blogUpdateStatus: boolean = await this.blogService.updateBlog(
      blogId,
      blogUpdateDTO,
    );
    if (!blogUpdateStatus) throw new NotFoundException();
  }

  @Delete(':blogId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlogById(@Param('blogId') blogId: string) {
    const deleteBlogStatus: boolean = await this.blogService.deleteBlog(blogId);
    if (!deleteBlogStatus) throw new NotFoundException();
  }
}
