import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { BlogService } from '../../blog-application/blog.service';
import { envVariables } from '../../../../config/app.env-variables';
import { BlogApiCreateUpdateDTO } from '../dto/blog-api.dto';
import { IBlogApiModel } from '../models/blog-api.model';
import { IPaginationQuery } from '../../../product-models/pagination.query';
import { IBlogPaginationModel } from '../models/blog-api.pagination.model';
import { BlogQueryRepository } from '../../blog-infrastructure/repositories/blog.query-repository';

@Controller('blogs')
export class BlogController {
  constructor(
    private readonly blogService: BlogService,
    private blogQueryRepository: BlogQueryRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBlog(
    @Body() blogCreateUpdateDTO: BlogApiCreateUpdateDTO,
  ): Promise<IBlogApiModel> {
    const createdBlog: IBlogApiModel = await this.blogService.createBlog(
      blogCreateUpdateDTO,
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

  @Get('config')
  getConfig(): string {
    return envVariables.MONGO_LOCAL;
  }
}
