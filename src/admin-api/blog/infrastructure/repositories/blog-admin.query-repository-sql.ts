import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BlogAdminApiPaginationQueryDTO } from '../../api/models/blog-admin-api.query-dto';
import {
  AdminApiBlogViewModel,
  AdminApiBlogsPaginationModel,
} from '../../api/models/blog-admin-api.models';

@Injectable()
export class AdminBlogQueryRepositorySQL {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getBlogsWithPagination(
    paginationQuery: BlogAdminApiPaginationQueryDTO,
  ): Promise<AdminApiBlogsPaginationModel> {
    let filter = '';
    if (paginationQuery.searchNameTerm) {
      filter = `WHERE b."name" ILIKE '%${paginationQuery.searchNameTerm}%'`;
    }
    let orderBy: string;
    const getCorrectOrderBy = (): void => {
      switch (paginationQuery.sortBy) {
        case 'createdAt':
          orderBy = 'b."created_at"';
          break;
        case 'name':
          orderBy = 'b."name"';
          break;
        case 'description':
          orderBy = 'b."description';
          break;
      }
    };
    getCorrectOrderBy();
    const blogsCount: [{ count: number }] = await this.dataSource.query(`
    SELECT COUNT(*)
    FROM public.blogs b
    ${filter}
    `);
    const totalBlogsCount: number = blogsCount[0].count;
    const howMuchToSkip: number =
      paginationQuery.pageSize * (paginationQuery.pageNumber - 1);
    const pagesCount: number = Math.ceil(
      totalBlogsCount / paginationQuery.pageSize,
    );
    const foundedBlogs: any[] = await this.dataSource.query(`
        SELECT b."id" as "blog_id", b."name", b."description", b."website_url", b."created_at",
         b."is_membership", b."is_banned", b."ban_date",
         u."id" as "user_id", u."login" as "user_login"
        FROM public.blogs b
        LEFT JOIN public.users u on b."blogger_id" = u."id"
        ${filter}
        ORDER BY ${orderBy} ${paginationQuery.sortDirection.toUpperCase()}
        LIMIT ${paginationQuery.pageSize} OFFSET ${howMuchToSkip}
        `);
    const mappedBlogs: AdminApiBlogViewModel[] = foundedBlogs.map(
      (blogFromDB) => {
        const mappedBlog: AdminApiBlogViewModel = {
          id: String(blogFromDB.blog_id),
          name: blogFromDB.name,
          description: blogFromDB.description,
          websiteUrl: blogFromDB.website_url,
          createdAt: blogFromDB.created_at,
          isMembership: blogFromDB.is_membership,
          blogOwnerInfo: {
            userId: blogFromDB.user_id ? String(blogFromDB.user_id) : null,
            userLogin: blogFromDB.user_login,
          },
          banInfo: {
            isBanned: blogFromDB.is_banned,
            banDate: blogFromDB.ban_date,
          },
        };
        return mappedBlog;
      },
    );
    const paginationBlogsResult: AdminApiBlogsPaginationModel = {
      pagesCount,
      page: Number(paginationQuery.pageNumber),
      pageSize: Number(paginationQuery.pageSize),
      totalCount: Number(totalBlogsCount),
      items: mappedBlogs,
    };
    return paginationBlogsResult;
  }
}
