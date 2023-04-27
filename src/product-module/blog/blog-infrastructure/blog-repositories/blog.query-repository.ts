import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BlogSchema } from '../../../product-domain/blog.entity';
import { Model } from 'mongoose';
import {
  BlogApiModelType,
  BlogApiPaginationModelType,
} from '../../blog-api/blog-api-models/blog-api.models';
import {
  FilterType,
  getDocumentsWithPagination,
  PaginationQueryType,
} from '../../../product-additional/get-documents-with-pagination.func';
import { PostDocument, PostSchema } from '../../../product-domain/post.entity';
import { PostRepositoryPaginationModelType } from '../../../post/post-infrastructure/post-repositories/post-repositories-models/post-repository.models';
import {
  PostApiModelType,
  PostApiPaginationModelType,
} from '../../../post/post-api/post-api-models/post-api.models';
import { BlogApiPaginationQueryDTO } from '../../blog-api/blog-api-models/blog-api.query-dto';
import { PostApiPaginationQueryDTOType } from '../../../post/post-api/post-api-models/post-api.query-dto';

@Injectable()
export class BlogQueryRepository {
  constructor(
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
  ) {}
  async getBlogsWithPagination(
    rawPaginationQuery: BlogApiPaginationQueryDTO,
  ): Promise<BlogApiPaginationModelType> {
    const filter: FilterType = [];
    const paginationQuery: PaginationQueryType = {
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
    if (rawPaginationQuery.searchNameTerm) {
      filter.push({
        value: rawPaginationQuery.searchNameTerm,
        property: 'name',
      });
    }
    const blogsWithPagination: BlogApiPaginationModelType =
      await getDocumentsWithPagination<BlogApiModelType>({
        query: paginationQuery,
        model: this.BlogModel,
        rawFilter: filter,
        lean: true,
      });
    return blogsWithPagination;
  }

  async getPostsWithPaginationByBlogId(
    rawPaginationQuery: PostApiPaginationQueryDTOType,
    blogId: string,
  ): Promise<PostApiPaginationModelType> {
    const postsWithPagination: PostRepositoryPaginationModelType =
      await getDocumentsWithPagination<PostDocument>({
        query: rawPaginationQuery,
        model: this.PostModel,
        rawFilter: [{ property: 'id', value: blogId }],
        lean: true,
      });
    const mappedPosts: PostApiModelType[] = [];
    for (const postDocument of postsWithPagination.items) {
      const resultPost: PostApiModelType = {
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
    const resultPostsPagination: PostApiPaginationModelType = {
      pagesCount: postsWithPagination.pagesCount,
      page: postsWithPagination.page,
      pageSize: postsWithPagination.pageSize,
      totalCount: postsWithPagination.totalCount,
      items: mappedPosts,
    };
    return resultPostsPagination;
  }

  async getBlogById(blogId: string): Promise<BlogApiModelType | null> {
    return this.BlogModel.findOne({ id: blogId }, { _id: false }).lean();
  }
}
