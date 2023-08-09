import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  FindOperator,
  FindOptionsOrder,
  ILike,
  Repository,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BlogPublicApiPaginationQueryDTO } from '../../api/models/blog-public-api.query-dto';
import {
  BlogPublicApiViewModel,
  BlogPublicApiPaginationModel,
} from '../../api/models/blog-public-api.models';
import { BlogSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/blog-sql.entity';

@Injectable()
export class PublicBlogQueryRepositorySQL {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(BlogSQLEntity)
    private readonly blogEntity: Repository<BlogSQLEntity>,
  ) {}

  async getBlogById(blogId: string): Promise<BlogPublicApiViewModel | null> {
    if (!Number(blogId)) {
      return null;
    }
    const result: any[] = await this.dataSource.query(
      `
    SELECT *
    FROM public.blogs b
    WHERE b."id" = $1 AND b."hidden" = false
    `,
      [blogId],
    );
    if (result.length < 1) {
      return null;
    }
    const res: any = result[0];
    return {
      id: String(res.id),
      name: res.name,
      description: res.description,
      websiteUrl: res.website_url,
      createdAt: res.created_at,
      isMembership: res.is_membership,
    };
  }

  async getBlogsWithPagination(
    paginationQuery: BlogPublicApiPaginationQueryDTO,
  ): Promise<BlogPublicApiPaginationModel> {
    const filter: Pick<
      Partial<BlogSQLEntity>,
      Exclude<keyof BlogSQLEntity, 'name'>
    > & { name?: FindOperator<string> } = {};
    const getCorrectFilter = (): void => {
      filter.hidden = false;
      if (paginationQuery.searchNameTerm) {
        filter.name = ILike(`%${paginationQuery.searchNameTerm}%`);
      }
    };
    getCorrectFilter();
    const orderBy: FindOptionsOrder<BlogSQLEntity> = {};
    const getCorrectOrderBy = (): void => {
      switch (paginationQuery.sortBy) {
        case 'createdAt':
          orderBy.createdAt = paginationQuery.sortDirection;
          break;
        case 'name':
          orderBy.name = paginationQuery.sortDirection;
          break;
        case 'description':
          orderBy.description = paginationQuery.sortDirection;
          break;
      }
    };
    getCorrectOrderBy();
    const totalBlogsCount: number = await this.blogEntity.countBy(filter);
    const howMuchToSkip: number =
      paginationQuery.pageSize * (paginationQuery.pageNumber - 1);
    const pagesCount: number = Math.ceil(
      totalBlogsCount / paginationQuery.pageSize,
    );
    const foundedBlogs: BlogSQLEntity[] = await this.blogEntity.find({
      where: filter,
      order: orderBy,
      take: paginationQuery.pageSize,
      skip: howMuchToSkip,
    });
    const mappedBlogs: BlogPublicApiViewModel[] = foundedBlogs.map(
      (blogFromDB) => {
        const mappedBlog: BlogPublicApiViewModel = {
          id: String(blogFromDB.id),
          name: blogFromDB.name,
          description: blogFromDB.description,
          websiteUrl: blogFromDB.websiteUrl,
          createdAt: blogFromDB.createdAt,
          isMembership: blogFromDB.isMembership,
        };
        return mappedBlog;
      },
    );
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
