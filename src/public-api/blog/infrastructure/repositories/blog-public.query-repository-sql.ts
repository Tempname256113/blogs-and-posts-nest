import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BlogPublicApiPaginationQueryDTO } from '../../api/models/blog-public-api.query-dto';
import {
  BlogPublicApiModel,
  BlogPublicApiPaginationModel,
} from '../../api/models/blog-public-api.models';

@Injectable()
export class PublicBlogQueryRepositorySQL {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getBlogsWithPagination(
    paginationQuery: BlogPublicApiPaginationQueryDTO,
  ): Promise<BlogPublicApiPaginationModel> {
    let filter: string;
    const getCorrectFilter = (): void => {
      filter = `b."hidden" = false`;
      if (paginationQuery.searchNameTerm) {
        filter += ` AND b."name" ILIKE '%${paginationQuery.searchNameTerm}%'`;
      }
    };
    getCorrectFilter();
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
    WHERE ${filter}
    `);
    const totalBlogsCount: number = blogsCount[0].count;
    const howMuchToSkip: number =
      paginationQuery.pageSize * (paginationQuery.pageNumber - 1);
    const pagesCount: number = Math.ceil(
      totalBlogsCount / paginationQuery.pageSize,
    );
    const foundedBlogs: any[] = await this.dataSource.query(`
        SELECT b."id", b."name", b."description", b."website_url", b."created_at", b."is_membership" 
        FROM public.blogs b
        WHERE ${filter}
        ORDER BY ${orderBy} ${paginationQuery.sortDirection.toUpperCase()}
        LIMIT ${paginationQuery.pageSize} OFFSET ${howMuchToSkip}
        `);
    const mappedBlogs: BlogPublicApiModel[] = foundedBlogs.map((blogFromDB) => {
      const mappedBlog: BlogPublicApiModel = {
        id: blogFromDB.id,
        name: blogFromDB.name,
        description: blogFromDB.description,
        websiteUrl: blogFromDB.website_url,
        createdAt: blogFromDB.created_at,
        isMembership: blogFromDB.is_membership,
      };
      return mappedBlog;
    });
    const paginationBlogsResult: BlogPublicApiPaginationModel = {
      pagesCount,
      page: Number(paginationQuery.pageNumber),
      pageSize: Number(paginationQuery.pageSize),
      totalCount: Number(totalBlogsCount),
      items: mappedBlogs,
    };
    return paginationBlogsResult;
  }
}
