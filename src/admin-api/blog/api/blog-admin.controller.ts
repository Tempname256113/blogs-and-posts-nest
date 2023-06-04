import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { BlogAdminQueryRepository } from '../infrastructure/repositories/blog-admin.query-repository';
import { BasicAuthGuard } from '../../../../libs/auth/passport-strategy/auth-basic.strategy';
import { BlogAdminApiPaginationQueryDTO } from './models/blog-admin-api.query-dto';
import { BlogBloggerApiPaginationQueryDTO } from '../../../blogger-api/blog/api/models/blog-blogger-api.query-dto';
import { BlogAdminApiPaginationModel } from './models/blog-admin-api.models';
import { CommandBus } from '@nestjs/cqrs';
import { BindBlogWithUserCommand } from '../application/use-cases/bind-blog-with-user.use-case';

@Controller('sa/blogs')
export class BlogAdminController {
  constructor(
    private blogQueryRepository: BlogAdminQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Get()
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getBlogsWithPagination(
    @Body() rawPaginationQuery: BlogAdminApiPaginationQueryDTO,
  ): Promise<BlogAdminApiPaginationModel> {
    const paginationQuery: BlogBloggerApiPaginationQueryDTO = {
      searchNameTerm: rawPaginationQuery.searchNameTerm ?? null,
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
    const blogsWithPagination: BlogAdminApiPaginationModel =
      await this.blogQueryRepository.getBlogsWithPagination(paginationQuery);
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
}
