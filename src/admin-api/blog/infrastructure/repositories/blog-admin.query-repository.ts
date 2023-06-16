import { Injectable } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import {
  Blog,
  BlogSchema,
} from '../../../../../libs/db/mongoose/schemes/blog.entity';
import {
  getPaginationUtils,
  PaginationUtilsType,
} from '../../../../modules/product/product-additional/get-documents-with-pagination.func';
import { BlogAdminApiPaginationQueryDTO } from '../../api/models/blog-admin-api.query-dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  BlogAdminApiModel,
  BlogAdminApiPaginationModel,
} from '../../api/models/blog-admin-api.models';

@Injectable()
export class BlogAdminQueryRepository {
  constructor(
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
  ) {}

  async getBlogsWithPagination(
    rawPaginationQuery: BlogAdminApiPaginationQueryDTO,
  ): Promise<BlogAdminApiPaginationModel> {
    const blogsWithPagination =
      async (): Promise<BlogAdminApiPaginationModel> => {
        let filter: FilterQuery<BlogSchema>;
        const getCorrectBlogsFilter = (): void => {
          if (!rawPaginationQuery.searchNameTerm) {
            filter = { hidden: false };
          } else {
            filter = {
              name: {
                $regex: rawPaginationQuery.searchNameTerm,
                $options: 'i',
              },
              hidden: false,
            };
          }
        };
        getCorrectBlogsFilter();
        const totalBlogsCount: number = await this.BlogModel.countDocuments(
          filter,
        );
        const additionalPaginationData: PaginationUtilsType =
          getPaginationUtils({
            pageSize: rawPaginationQuery.pageSize,
            sortBy: rawPaginationQuery.sortBy,
            totalDocumentsCount: totalBlogsCount,
            pageNumber: rawPaginationQuery.pageNumber,
            sortDirection: rawPaginationQuery.sortDirection,
          });
        const foundedBlogs: Blog[] = await this.BlogModel.find(
          filter,
          { _id: false },
          {
            limit: rawPaginationQuery.pageSize,
            skip: additionalPaginationData.howMuchToSkip,
            sort: additionalPaginationData.sortQuery,
          },
        ).lean();
        const mappedBlogs: BlogAdminApiModel[] = foundedBlogs.map(
          (blogFromDB) => {
            const mappedBlog: BlogAdminApiModel = {
              id: blogFromDB.id,
              name: blogFromDB.name,
              description: blogFromDB.description,
              websiteUrl: blogFromDB.websiteUrl,
              createdAt: blogFromDB.createdAt,
              isMembership: blogFromDB.isMembership,
              blogOwnerInfo: {
                userId: blogFromDB.bloggerId,
                userLogin: blogFromDB.bloggerLogin,
              },
              banInfo: {
                isBanned: blogFromDB.isBanned,
                banDate: blogFromDB.banDate,
              },
            };
            return mappedBlog;
          },
        );
        const paginationBlogsResult: BlogAdminApiPaginationModel = {
          pagesCount: additionalPaginationData.pagesCount,
          page: Number(rawPaginationQuery.pageNumber),
          pageSize: Number(rawPaginationQuery.pageSize),
          totalCount: Number(totalBlogsCount),
          items: mappedBlogs,
        };
        return paginationBlogsResult;
      };
    return blogsWithPagination();
  }
}
