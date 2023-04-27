import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PostDocument, PostSchema } from '../../../product-domain/post.entity';
import { Model } from 'mongoose';
import { PostRepositoryPaginationModelType } from './post-repositories-models/post-repository.models';
import { getDocumentsWithPagination } from '../../../product-additional/get-documents-with-pagination.func';
import {
  PostApiModelType,
  PostApiPaginationModelType,
} from '../../post-api/post-api-models/post-api.models';
import { PostApiPaginationQueryDTOType } from '../../post-api/post-api-models/post-api.query-dto';

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
  ) {}
  async getPostById(postId: string): Promise<PostApiModelType | null> {
    const foundedPost: PostDocument | null = await this.PostModel.findOne({
      id: postId,
    });
    if (!foundedPost) return null;
    const postToClient: PostApiModelType = {
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
    rawQueryPaginationDTO: PostApiPaginationQueryDTOType,
  ): Promise<PostApiPaginationModelType> {
    const postsWithPagination: PostRepositoryPaginationModelType =
      await getDocumentsWithPagination<PostDocument, PostSchema>({
        query: rawQueryPaginationDTO,
        model: this.PostModel,
      });
    const apiPosts: PostApiModelType[] = [];
    for (const postDocument of postsWithPagination.items) {
      const mappedPost: PostApiModelType = {
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
      apiPosts.push(mappedPost);
    }
    const paginationResult: PostApiPaginationModelType = {
      pagesCount: postsWithPagination.pagesCount,
      page: postsWithPagination.page,
      pageSize: postsWithPagination.pageSize,
      totalCount: postsWithPagination.totalCount,
      items: apiPosts,
    };
    return paginationResult;
  }
}
