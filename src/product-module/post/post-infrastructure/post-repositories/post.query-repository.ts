import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PostDocument,
  PostSchema,
} from '../../../product-domain/post/post.entity';
import { Model } from 'mongoose';
import { IPostRepositoryPaginationModel } from './post-repositories-models/post-repository.pagination.model';
import { getDocumentsWithPagination } from '../../../product-additional/get-entity-with-pagination.func';
import {
  IPostApiModel,
  IPostApiPaginationModel,
} from '../../post-api/post-api-models/post-api.models';
import { IPostApiPaginationQueryDTO } from '../../post-api/post-api-models/post-api.query-dto';

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
  ) {}
  async getPostById(postId: string): Promise<IPostApiModel | null> {
    const foundedPost: PostDocument | null = await this.PostModel.findOne({
      id: postId,
    });
    const postToClient: IPostApiModel = {
      id: foundedPost.id,
      title: foundedPost.title,
      shortDescription: foundedPost.shortDescription,
      content: foundedPost.content,
      blogId: foundedPost.blogId,
      blogName: foundedPost.blogName,
      createdAt: foundedPost.createdAt,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      },
    };
    return postToClient;
  }

  async getPostsWithPagination(
    rawQueryPaginationDTO: IPostApiPaginationQueryDTO,
  ): Promise<IPostApiPaginationModel> {
    const postsWithPagination: IPostRepositoryPaginationModel =
      await getDocumentsWithPagination<PostDocument, PostSchema>(
        rawQueryPaginationDTO,
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
