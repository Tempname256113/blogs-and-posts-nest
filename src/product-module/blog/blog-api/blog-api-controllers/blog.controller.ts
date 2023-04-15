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
import { IBlogApiCreateUpdateDTO } from '../blog-api-dto/blog-api.dto';
import { IBlogApiModel } from '../blog-api-models/blog-api.model';
import { IPaginationQuery } from '../../../product-models/pagination.query';
import { IBlogPaginationModel } from '../blog-api-models/blog-api.pagination.model';
import { BlogQueryRepository } from '../../blog-infrastructure/blog-repositories/blog.query-repository';

@Controller('blogs')
export class BlogController {
  constructor(
    private readonly blogService: BlogService,
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

  @Get()
  @HttpCode(HttpStatus.OK)
  async getBlogsWithPagination(
    @Query()
    query: IPaginationQuery,
  ): Promise<IBlogPaginationModel> {
    const queries: IPaginationQuery = {
      searchNameTerm: query.searchNameTerm ?? null,
      sortBy: query.sortBy ?? 'createdAt',
      sortDirection: query.sortDirection ?? 'desc',
      pageNumber: query.pageNumber ?? 1,
      pageSize: query.pageSize ?? 10,
    };
    const blogsWithPagination: IBlogPaginationModel =
      await this.blogQueryRepository.getBlogsWithPagination(queries);
    return blogsWithPagination;
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
  ) {
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
