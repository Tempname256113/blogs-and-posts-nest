import { Injectable } from '@nestjs/common';
import { IPaginationQueryApiDTO } from '../../../product-dto/pagination.query.dto';
import { InjectModel } from '@nestjs/mongoose';
import { BlogSchema } from '../../blog-application/blog-domain/blog.entity';
import { Model } from 'mongoose';
import { IBlogPaginationModel } from '../../blog-api/blog-api-models/blog-api.pagination.model';
import { IBlogApiModel } from '../../blog-api/blog-api-models/blog-api.model';
import { getDocumentsWithPagination } from '../../../product-additional/get-entity-with-pagination.func';
import {
  PostDocument,
  PostSchema,
} from '../../../post/post-api/post-application/post-domain/post.entity';
import { IPostRepositoryPaginationModel } from '../../../post/post-infrastructure/post-repositories/post-repositories-models/post-repository.pagination.model';
import { IPostApiModel } from '../../../post/post-api/post-api-models/post-api.model';
import { IPostApiPaginationModel } from '../../../post/post-api/post-api-models/post-api.pagination.model';

@Injectable()
export class BlogQueryRepository {
  constructor(
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
  ) {}
  async getBlogsWithPagination(
    query: IPaginationQueryApiDTO,
  ): Promise<IBlogPaginationModel> {
    const blogsWithPagination: IBlogPaginationModel =
      await getDocumentsWithPagination<IBlogApiModel, BlogSchema>(
        query,
        this.BlogModel,
      );
    return blogsWithPagination;
  }

  async getPostsWithPaginationByBlogId(
    query: IPaginationQueryApiDTO,
    blogId: string,
  ): Promise<IPostApiPaginationModel> {
    const mappedQuery: IPaginationQueryApiDTO = {
      searchNameTerm: blogId,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
    };
    const postsWithPagination: IPostRepositoryPaginationModel =
      await getDocumentsWithPagination<PostDocument, PostSchema>(
        mappedQuery,
        this.PostModel,
        'blogId',
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
