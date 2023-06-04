import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { PostApiPaginationQueryDTO } from '../../post/api/models/post-api.query-dto';
import { AccessToken } from '../../../../generic-decorators/access-token.decorator';
import { PostApiPaginationModelType } from '../../post/api/models/post-api.models';
import { BlogPublicQueryRepository } from '../infrastructure/repositories/blog-public.query-repository';
import {
  BlogPublicApiModel,
  BlogPublicApiPaginationModel,
} from './models/blog-public-api.models';
import { BlogPublicApiPaginationQueryDTO } from './models/blog-public-api.query-dto';

@Controller('blogs')
export class BlogPublicController {
  constructor(private blogQueryRepository: BlogPublicQueryRepository) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getBlogsWithPagination(
    @Query()
    rawPaginationQuery: BlogPublicApiPaginationQueryDTO,
  ): Promise<BlogPublicApiPaginationModel> {
    const paginationQuery: BlogPublicApiPaginationQueryDTO = {
      searchNameTerm: rawPaginationQuery.searchNameTerm ?? null,
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
    const blogsWithPagination: BlogPublicApiPaginationModel =
      await this.blogQueryRepository.getBlogsWithPagination(paginationQuery);
    return blogsWithPagination;
  }

  @Get(':blogId/posts')
  @HttpCode(HttpStatus.OK)
  async getPostsWithPaginationByBlogId(
    @Query()
    rawPaginationQuery: PostApiPaginationQueryDTO,
    @Param('blogId') blogId: string,
    @AccessToken() accessToken: string | null,
  ): Promise<PostApiPaginationModelType> {
    const paginationQuery: PostApiPaginationQueryDTO = {
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
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
  ): Promise<BlogPublicApiModel> {
    const foundedBlog: BlogPublicApiModel | null =
      await this.blogQueryRepository.getBlogById(blogId);
    if (!foundedBlog) throw new NotFoundException();
    return foundedBlog;
  }
}
