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
    const foundedBlog: BlogSQLEntity | null = await this.blogEntity.findOneBy({
      id: Number(blogId),
      hidden: false,
    });
    if (!foundedBlog) {
      return null;
    }
    return {
      id: String(foundedBlog.id),
      name: foundedBlog.name,
      description: foundedBlog.description,
      websiteUrl: foundedBlog.websiteUrl,
      createdAt: foundedBlog.createdAt,
      isMembership: foundedBlog.isMembership,
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
    const howMuchToSkip: number =
      paginationQuery.pageSize * (paginationQuery.pageNumber - 1);
    const [foundedBlogs, totalBlogsCount]: [BlogSQLEntity[], number] =
      await this.blogEntity.findAndCount({
        where: filter,
        order: orderBy,
        take: paginationQuery.pageSize,
        skip: howMuchToSkip,
      });
    const pagesCount: number = Math.ceil(
      totalBlogsCount / paginationQuery.pageSize,
    );
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
