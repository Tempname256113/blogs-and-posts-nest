import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PostDocument,
  PostSchema,
} from '../../post-api/post-application/post-domain/post.entity';
import { Model } from 'mongoose';
import { IPostApiPaginationModel } from '../../post-api/post-api-models/post-api.pagination.model';
import { IPostRepositoryPaginationModel } from './post-repositories-models/post-repository.pagination.model';
import { getDocumentsWithPagination } from '../../../product-additional/get-entity-with-paging.func';
import { IPaginationQuery } from '../../../product-models/pagination.query.model';
import { IPostApiModel } from '../../post-api/post-api-models/post-api.model';

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
  ) {}
  async getPostById(postId: string): Promise<PostDocument | null> {
    return this.PostModel.findOne({ id: postId });
  }

  async getPostsWithPagination(
    queryPagination: IPaginationQuery,
  ): Promise<IPostApiPaginationModel> {
    const postsWithPagination: IPostRepositoryPaginationModel =
      await getDocumentsWithPagination<PostDocument, PostSchema>(
        queryPagination,
        this.PostModel,
      );
    const apiPosts: IPostApiModel[] = [];
    postsWithPagination.items.forEach((post) => {
      const mappedPost: IPostApiModel = {
        id: post.id,
        title: post.title,
        shortDescription: post.shortDescription,
        content: post.content,
        blogId: post.blogId,
        blogName: post.blogName,
        createdAt: post.createdAt,
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
          newestLikes: [],
        },
      };
      apiPosts.push(mappedPost);
    });
    const paginationResult: IPostApiPaginationModel = {
      pagesCount: postsWithPagination.pagesCount,
      page: postsWithPagination.page,
      pageSize: postsWithPagination.pageSize,
      totalCount: postsWithPagination.totalCount,
      items: apiPosts,
    };
    return paginationResult;
  }
}
