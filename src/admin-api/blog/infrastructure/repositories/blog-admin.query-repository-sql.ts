import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BlogAdminApiPaginationQueryDTO } from '../../api/models/blog-admin-api.query-dto';
import {
  AdminApiBlogViewModel,
  AdminApiBlogsPaginationModel,
} from '../../api/models/blog-admin-api.models';
import { BlogSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/blog-sql.entity';
import { UserSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/users/user-sql.entity';

@Injectable()
export class AdminBlogQueryRepositorySQL {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(BlogSQLEntity)
    private readonly blogEntity: Repository<BlogSQLEntity>,
  ) {}

  async getBlogsWithPagination(
    paginationQuery: BlogAdminApiPaginationQueryDTO,
  ): Promise<AdminApiBlogsPaginationModel> {
    const getFilter = (): {
      query: string;
      additional: { [key: string]: string };
    } => {
      let filter = '';
      const additional: { [key: string]: string } = {};
      if (paginationQuery.searchNameTerm) {
        filter = `b.name ILIKE :blogName`;
        additional.blogName = `%${paginationQuery.searchNameTerm}%`;
      }
      return {
        query: filter,
        additional,
      };
    };
    const getCorrectOrderBy = (): {
      query: string;
      sortDirection: 'ASC' | 'DESC';
    } => {
      const correctSortDirection: 'ASC' | 'DESC' =
        paginationQuery.sortDirection === 'asc' ? 'ASC' : 'DESC';
      switch (paginationQuery.sortBy) {
        case 'createdAt':
          return {
            query: 'b.createdAt',
            sortDirection: correctSortDirection,
          };
        case 'name':
          return {
            query: 'b.name',
            sortDirection: correctSortDirection,
          };
        case 'description':
          return {
            query: 'b.description',
            sortDirection: correctSortDirection,
          };
      }
    };
    const filter: ReturnType<typeof getFilter> = getFilter();
    const orderBy: ReturnType<typeof getCorrectOrderBy> = getCorrectOrderBy();
    const getTotalBlogsCount = async (): Promise<number> => {
      const queryBuilder: SelectQueryBuilder<BlogSQLEntity> =
        await this.dataSource.createQueryBuilder(BlogSQLEntity, 'b');
      return queryBuilder.where(filter.query, filter.additional).getCount();
    };
    const totalBlogsCount: number = await getTotalBlogsCount();
    const howMuchToSkip: number =
      paginationQuery.pageSize * (paginationQuery.pageNumber - 1);
    const pagesCount: number = Math.ceil(
      totalBlogsCount / paginationQuery.pageSize,
    );
    const queryBuilder: SelectQueryBuilder<BlogSQLEntity> =
      await this.dataSource.createQueryBuilder(BlogSQLEntity, 'b');
    const foundedBlogs: {
      b_id: number;
      b_name: string;
      b_description: string;
      b_websiteUrl: string;
      b_createdAt: string;
      b_isMembership: boolean;
      b_isBanned: boolean;
      b_banDate: string | null;
      u_id: number;
      u_login: string;
    }[] = await queryBuilder
      .select([
        'b.id',
        'b.name',
        'b.description',
        'b.websiteUrl',
        'b.createdAt',
        'b.isMembership',
        'b.isBanned',
        'b.banDate',
        'u.id',
        'u.login',
      ])
      .leftJoin(UserSQLEntity, 'u', 'b.bloggerId = u.id')
      .where(filter.query, filter.additional)
      .orderBy(orderBy.query, orderBy.sortDirection)
      .limit(paginationQuery.pageSize)
      .offset(howMuchToSkip)
      .getRawMany();
    const mappedBlogs: AdminApiBlogViewModel[] = foundedBlogs.map(
      (blogFromDB) => {
        const mappedBlog: AdminApiBlogViewModel = {
          id: String(blogFromDB.b_id),
          name: blogFromDB.b_name,
          description: blogFromDB.b_description,
          websiteUrl: blogFromDB.b_websiteUrl,
          createdAt: blogFromDB.b_createdAt,
          isMembership: blogFromDB.b_isMembership,
          blogOwnerInfo: {
            userId: blogFromDB.u_id ? String(blogFromDB.u_id) : null,
            userLogin: blogFromDB.u_login,
          },
          banInfo: {
            isBanned: blogFromDB.b_isBanned,
            banDate: blogFromDB.b_banDate,
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
