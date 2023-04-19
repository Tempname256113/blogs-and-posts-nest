import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BlogSchema } from '../../../product-domain/blog/blog.entity';
import { Model } from 'mongoose';
import {
  IBlogApiModel,
  IBlogApiPaginationModel,
} from '../../blog-api/blog-api-models/blog-api.models';
import {
  getDocumentsWithPagination,
  IPaginationQuery,
} from '../../../product-additional/get-entity-with-pagination.func';
import {
  PostDocument,
  PostSchema,
} from '../../../product-domain/post/post.entity';
import { IPostRepositoryPaginationModel } from '../../../post/post-infrastructure/post-repositories/post-repositories-models/post-repository.pagination.model';
import {
  IPostApiModel,
  IPostApiPaginationModel,
} from '../../../post/post-api/post-api-models/post-api.models';
import { IBlogApiPaginationQueryDTO } from '../../blog-api/blog-api-models/blog-api.query-dto';
import { IPostApiPaginationQueryDTO } from '../../../post/post-api/post-api-models/post-api.query-dto';

@Injectable()
export class BlogQueryRepository {
  constructor(
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
  ) {}
  async getBlogsWithPagination(
    rawPaginationQuery: IBlogApiPaginationQueryDTO,
  ): Promise<IBlogApiPaginationModel> {
    const filter: { [prop: string]: string } = {};
    const paginationQuery: IPaginationQuery = {
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
    if (rawPaginationQuery.searchNameTerm)
      filter.name = rawPaginationQuery.searchNameTerm;
    const blogsWithPagination: IBlogApiPaginationModel =
      await getDocumentsWithPagination<IBlogApiModel, BlogSchema>(
        paginationQuery,
        this.BlogModel,
        filter,
      );
    return blogsWithPagination;
  }

  async getPostsWithPaginationByBlogId(
    rawPaginationQuery: IPostApiPaginationQueryDTO,
    blogId: string,
  ): Promise<IPostApiPaginationModel> {
    const postsWithPagination: IPostRepositoryPaginationModel =
      await getDocumentsWithPagination<PostDocument, PostSchema>(
        rawPaginationQuery,
        this.PostModel,
        {},
        { blogId },
      );
    const mappedPosts: IPostApiModel[] = [];
    for (const postDocument of postsWithPagination.items) {
      const resultPost: IPostApiModel = {
        id: postDocument.id,
        title: postDocument.title,
        shortDescription: postDocument.shortDescription,
        content: postDocument.content,
        blogId: postDocument.blogId,
        blogName: postDocument.blogName,
        createdAt: postDocument.createdAt,
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
          newestLikes: [],
        },
      };
      mappedPosts.push(resultPost);
    }
    const resultPostsPagination: IPostApiPaginationModel = {
      pagesCount: postsWithPagination.pagesCount,
      page: postsWithPagination.page,
      pageSize: postsWithPagination.pageSize,
      totalCount: postsWithPagination.totalCount,
      items: mappedPosts,
    };
    return resultPostsPagination;
  }

  async getBlogById(blogId: string): Promise<IBlogApiModel | null> {
    return this.BlogModel.findOne({ id: blogId }, { _id: false }).lean();
  }
}
