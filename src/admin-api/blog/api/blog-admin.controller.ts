import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BasicAuthGuard } from '../../../../libs/auth/passport-strategy/auth-basic.strategy';
import { BlogAdminApiPaginationQueryDTO } from './models/blog-admin-api.query-dto';
import { BlogBloggerApiPaginationQueryDTO } from '../../../blogger-api/blog/api/models/blog-blogger-api.query-dto';
import { AdminApiBlogsPaginationModel } from './models/blog-admin-api.models';
import { CommandBus } from '@nestjs/cqrs';
import { BindBlogWithUserCommand } from '../application/use-cases/bind-blog-with-user.use-case';
import { BanBlogAdminApiDTO } from './models/blog-admin-api.dto';
import { BanUnbanBlogCommand } from '../application/use-cases/ban-unban-blog.use-case';
import { AdminBlogQueryRepositorySQL } from '../infrastructure/repositories/blog-admin.query-repository-sql';

@Controller('sa/blogs')
export class BlogAdminController {
  constructor(
    private readonly blogQueryRepositorySQL: AdminBlogQueryRepositorySQL,
    private commandBus: CommandBus,
  ) {}

  @Get()
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getBlogsWithPagination(
    @Query() rawPaginationQuery: BlogAdminApiPaginationQueryDTO,
  ): Promise<AdminApiBlogsPaginationModel> {
    const paginationQuery: BlogBloggerApiPaginationQueryDTO = {
      searchNameTerm: rawPaginationQuery.searchNameTerm ?? null,
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
    const blogsWithPagination: AdminApiBlogsPaginationModel =
      await this.blogQueryRepositorySQL.getBlogsWithPagination(paginationQuery);
    return blogsWithPagination;
  }

  @Put(':blogId/bind-with-user/:userId')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async bindBlogWithUser(
    @Param('blogId') blogId: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new BindBlogWithUserCommand({ blogId, userId }),
    );
  }

  @Put(':blogId/ban')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async banUnbanBlog(
    @Param('blogId') blogId: string,
    @Body() blogBanDTO: BanBlogAdminApiDTO,
  ): Promise<void> {
    await this.commandBus.execute<BanUnbanBlogCommand, void>(
      new BanUnbanBlogCommand({ banBlogDTO: blogBanDTO, blogId }),
    );
  }
}
