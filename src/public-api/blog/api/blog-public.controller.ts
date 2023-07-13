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
import { PostPaginationViewModel } from '../../post/api/models/post-api.models';
import {
  BlogPublicApiViewModel,
  BlogPublicApiPaginationModel,
} from './models/blog-public-api.models';
import { BlogPublicApiPaginationQueryDTO } from './models/blog-public-api.query-dto';
import { PublicBlogQueryRepositorySQL } from '../infrastructure/repositories/blog-public.query-repository-sql';
import { PublicPostQueryRepositorySQL } from '../../post/infrastructure/repositories/post-public.query-repository-sql';

@Controller('blogs')
export class BlogPublicController {
  constructor(
    private readonly blogQueryRepositorySQL: PublicBlogQueryRepositorySQL,
    private readonly postQueryRepositorySQL: PublicPostQueryRepositorySQL,
  ) {}

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
      await this.blogQueryRepositorySQL.getBlogsWithPagination(paginationQuery);
    return blogsWithPagination;
  }

  @Get(':blogId/posts')
  @HttpCode(HttpStatus.OK)
  async getPostsWithPaginationByBlogId(
    @Query()
    rawPaginationQuery: PostApiPaginationQueryDTO,
    @Param('blogId') blogId: string,
    @AccessToken() accessToken: string | null,
  ): Promise<PostPaginationViewModel> {
    const paginationQuery: PostApiPaginationQueryDTO = {
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
    const foundedPostsByBlogId: PostPaginationViewModel =
      await this.postQueryRepositorySQL.getPostsWithPaginationByBlogId({
        paginationQuery,
        blogId,
        accessToken,
      });
    return foundedPostsByBlogId;
  }

  @Get(':blogId')
  @HttpCode(HttpStatus.OK)
  async getBlogById(
    @Param('blogId') blogId: string,
  ): Promise<BlogPublicApiViewModel> {
    const foundedBlog: BlogPublicApiViewModel | null =
      await this.blogQueryRepositorySQL.getBlogById(blogId);
    if (!foundedBlog) throw new NotFoundException();
    return foundedBlog;
  }
}
