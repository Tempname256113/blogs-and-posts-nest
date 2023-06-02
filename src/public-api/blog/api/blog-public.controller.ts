import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { BlogApiPaginationQueryDTO } from '../../../product-module/blog/blog-api/blog-api-models/blog-api.query-dto';
import {
  BlogApiModelType,
  BlogApiPaginationModelType,
} from '../../../product-module/blog/blog-api/blog-api-models/blog-api.models';
import { PostApiPaginationQueryDTOType } from '../../post/api/models/post-api.query-dto';
import { AccessToken } from '../../../../generic-decorators/access-token.decorator';
import { PostApiPaginationModelType } from '../../post/api/models/post-api.models';
import { BlogPublicQueryRepository } from '../infrastructure/repositories/blog-public.query-repository';

@Controller('blogs')
export class BlogPublicController {
  constructor(private blogQueryRepository: BlogPublicQueryRepository) {}

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
    @AccessToken() accessToken: string | null,
  ): Promise<PostApiPaginationModelType> {
    const paginationQuery: PostApiPaginationQueryDTOType = {
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
  ): Promise<BlogApiModelType> {
    const foundedBlog: BlogApiModelType | null =
      await this.blogQueryRepository.getBlogById(blogId);
    if (!foundedBlog) throw new NotFoundException();
    return foundedBlog;
  }
}
