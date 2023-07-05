import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BloggerRepositoryBlogType } from './models/blogger-repository.models';
import { BlogBloggerApiPaginationQueryDTO } from '../../api/models/blog-blogger-api.query-dto';
import {
  BlogBloggerApiPaginationViewModel,
  BlogBloggerApiViewModel,
} from '../../api/models/blog-blogger-api.models';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';

@Injectable()
export class BloggerBlogQueryRepositorySQL {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly jwtUtils: JwtUtils,
  ) {}

  async getBlogByIdInternalUse(
    blogId: string,
  ): Promise<BloggerRepositoryBlogType | null> {
    if (!Number(blogId)) {
      return null;
    }
    const result: any[] = await this.dataSource.query(
      `
    SELECT *
    FROM public.blogs b
    WHERE b."id" = $1
    `,
      [blogId],
    );
    if (result.length < 1) {
      return null;
    }
    const res: any = result[0];
    return {
      id: String(res.id),
      bloggerId: String(res.blogger_id),
      name: res.name,
      description: res.description,
      websiteUrl: res.website_url,
      createdAt: res.created_at,
      isMembership: res.is_membership,
      isBanned: res.is_banned,
      banDate: res.ban_date,
      hidden: res.hidden,
    };
  }

  async getBlogsWithPaginationForCurrentUser({
    paginationQuery,
    accessToken,
  }: {
    paginationQuery: BlogBloggerApiPaginationQueryDTO;
    accessToken: string;
  }): Promise<BlogBloggerApiPaginationViewModel> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const bloggerId: string = accessTokenPayload.userId;
    const blogsWithPagination =
      async (): Promise<BlogBloggerApiPaginationViewModel> => {
        let filter: string;
        const getCorrectBlogsFilter = (): void => {
          if (paginationQuery.searchNameTerm) {
            filter = `b."name" ILIKE '%${paginationQuery.searchNameTerm}%' AND b."blogger_id" = '${bloggerId}'`;
          } else {
            filter = `b."blogger_id" = '${bloggerId}'`;
          }
        };
        getCorrectBlogsFilter();
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
        const mappedBlogs: BlogBloggerApiViewModel[] = foundedBlogs.map(
          (blogFromDB) => {
            const mappedBlog: BlogBloggerApiViewModel = {
              id: String(blogFromDB.id),
              name: blogFromDB.name,
              description: blogFromDB.description,
              websiteUrl: blogFromDB.website_url,
              createdAt: blogFromDB.created_at,
              isMembership: blogFromDB.is_membership,
            };
            return mappedBlog;
          },
        );
        const paginationBlogsResult: BlogBloggerApiPaginationViewModel = {
          pagesCount,
          page: Number(paginationQuery.pageNumber),
          pageSize: Number(paginationQuery.pageSize),
          totalCount: Number(totalBlogsCount),
          items: mappedBlogs,
        };
        return paginationBlogsResult;
      };
    return blogsWithPagination();
  }
}
