import { Injectable } from '@nestjs/common';
import { IPaginationQuery } from '../../../product-models/pagination.query';
import { InjectModel } from '@nestjs/mongoose';
import {
  Blog,
  BlogSchema,
} from '../../blog-application/blog-domain/blog.entity';
import { Model } from 'mongoose';
import { IBlogPaginationModel } from '../../blog-api/blog-api-models/blog-api.pagination.model';
import { IBlogApiModel } from '../../blog-api/blog-api-models/blog-api.model';

@Injectable()
export class BlogQueryRepository {
  constructor(
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
  ) {}
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
    const blogsWithPagination: Blog[] = await this.BlogModel.find(
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

  async getBlogById(blogId: string): Promise<IBlogApiModel | null> {
    return this.BlogModel.findOne({ id: blogId }, { _id: false }).lean();
  }
}
