import { Injectable } from '@nestjs/common';
import { IPaginationQuery } from '../../../product-models/pagination.query';
import { InjectModel } from '@nestjs/mongoose';
import { Blog } from '../../blog-application/blog-domain/blog.schema';
import { Model } from 'mongoose';
import { IBlogDBModel } from './models/blog.db-model';
import { IBlogPaginationModel } from '../../blog-api/models/blog-api.pagination.model';

@Injectable()
export class BlogQueryRepository {
  constructor(@InjectModel(Blog.name) private BlogModel: Model<Blog>) {}
  async getBlogsWithPagination(
    query: IPaginationQuery,
  ): Promise<IBlogPaginationModel> {
    let filter = {};
    let sortDirection: 1 | -1 = -1;
    if (query.sortDirection === 'asc') sortDirection = 1;
    const sortQuery = { [query.sortBy]: sortDirection };
    if (query.searchNameTerm)
      filter = { name: { $regex: query.searchNameTerm, $options: 'i' } };
    const howMuchToSkip: number = query.pageSize * (query.pageNumber - 1);
    const blogsTotalCount: number = await this.BlogModel.countDocuments(filter);
    const blogsWithPagination: IBlogDBModel[] = await this.BlogModel.find(
      filter,
      { _id: false },
      { limit: query.pageSize, skip: howMuchToSkip, sort: sortQuery },
    ).lean();
    const pagesCount: number = Math.ceil(blogsTotalCount / query.pageSize);
    const resultOfBlogsPagination: IBlogPaginationModel = {
      pagesCount,
      page: query.pageNumber,
      pageSize: query.pageSize,
      totalCount: blogsTotalCount,
      items: blogsWithPagination,
    };
    return resultOfBlogsPagination;
  }
}
