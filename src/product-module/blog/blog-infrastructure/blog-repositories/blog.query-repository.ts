import { Injectable } from '@nestjs/common';
import { IPaginationQuery } from '../../../product-models/pagination.query.model';
import { InjectModel } from '@nestjs/mongoose';
import { BlogSchema } from '../../blog-application/blog-domain/blog.entity';
import { Model } from 'mongoose';
import { IBlogPaginationModel } from '../../blog-api/blog-api-models/blog-api.pagination.model';
import { IBlogApiModel } from '../../blog-api/blog-api-models/blog-api.model';
import { getDocumentsWithPagination } from '../../../product-additional/get-entity-with-paging.func';

@Injectable()
export class BlogQueryRepository {
  constructor(
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
  ) {}
  async getBlogsWithPagination(
    query: IPaginationQuery,
  ): Promise<IBlogPaginationModel> {
    const blogsWithPagination: IBlogPaginationModel =
      await getDocumentsWithPagination<IBlogApiModel, BlogSchema>(
        query,
        this.BlogModel,
      );
    return blogsWithPagination;
  }

  async getBlogById(blogId: string): Promise<IBlogApiModel | null> {
    return this.BlogModel.findOne({ id: blogId }, { _id: false }).lean();
  }
}
