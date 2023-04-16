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
import { IPaginationQuery } from '../../../product-models/pagination.query.model';
import { IBlogPaginationModel } from '../blog-api-models/blog-api.pagination.model';
import { BlogQueryRepository } from '../../blog-infrastructure/blog-repositories/blog.query-repository';
import { PaginationQueryTransformerPipe } from '../../../product-pipes/pagination.query.transformer-pipe';

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
    @Query(new PaginationQueryTransformerPipe())
    paginationQuery: IPaginationQuery,
  ): Promise<IBlogPaginationModel> {
    const blogsWithPagination: IBlogPaginationModel =
      await this.blogQueryRepository.getBlogsWithPagination(paginationQuery);
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
