import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PostDocument,
  PostSchema,
} from '../../../../../libs/db/mongoose/schemes/post.entity';
import { Model } from 'mongoose';
import { PostRepositoryPaginationModelType } from './post-repositories-models/post-repository.models';
import { getDocumentsWithPagination } from '../../../product-additional/get-documents-with-pagination.func';
import {
  PostApiModel,
  PostApiPaginationModelType,
  PostNewestLikeType,
} from '../../post-api/post-api-models/post-api.models';
import { PostApiPaginationQueryDTOType } from '../../post-api/post-api-models/post-api.query-dto';
import { JwtHelpers } from '../../../../../libs/auth/jwt/jwt-helpers.service';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { Like } from '../../../../../libs/db/mongoose/schemes/like.entity';
import { LikeQueryRepository } from '../../../like/like.query-repository';

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    private likeQueryRepository: LikeQueryRepository,
    private jwtHelpers: JwtHelpers,
  ) {}
  async getPostById(
    postId: string,
    accessToken: string | null,
  ): Promise<PostApiModel | null> {
    const getUserId = (): string => {
      if (accessToken) {
        const accessTokenPayload: JwtAccessTokenPayloadType | null =
          this.jwtHelpers.verifyAccessToken(accessToken);
        if (!accessTokenPayload) {
          return '';
        } else {
          return accessTokenPayload.userId;
        }
      } else {
        return '';
      }
    };
    const userId: string = getUserId();
    const postReactionsCount: { likesCount: number; dislikesCount: number } =
      await this.likeQueryRepository.getEntityLikesCount(postId);
    const foundedPost: PostDocument | null = await this.PostModel.findOne({
      id: postId,
    });
    if (!foundedPost) throw new NotFoundException();
    const userLikeStatus: 'None' | 'Like' | 'Dislike' =
      await this.likeQueryRepository.getUserLikeStatus({
        userId,
        entityId: foundedPost.id,
      });
    const lastLikes: Like[] = await this.likeQueryRepository.getEntityLastLikes(
      foundedPost.id,
    );
    const newestLikesArray: PostNewestLikeType[] = [];
    for (const rawLike of lastLikes) {
      const mappedLike: PostNewestLikeType = {
        addedAt: rawLike.addedAt,
        userId: rawLike.userId,
        login: rawLike.userLogin,
      };
      newestLikesArray.push(mappedLike);
    }
    const postToClient: PostApiModel = {
      id: foundedPost.id,
      title: foundedPost.title,
      shortDescription: foundedPost.shortDescription,
      content: foundedPost.content,
      blogId: foundedPost.blogId,
      blogName: foundedPost.blogName,
      createdAt: foundedPost.createdAt,
      extendedLikesInfo: {
        likesCount: postReactionsCount.likesCount,
        dislikesCount: postReactionsCount.dislikesCount,
        myStatus: userLikeStatus,
        newestLikes: newestLikesArray,
      },
    };
    return postToClient;
  }

  async getPostsWithPagination(
    rawQueryPaginationDTO: PostApiPaginationQueryDTOType,
    accessToken: string | null,
  ): Promise<PostApiPaginationModelType> {
    const postsWithPagination: PostRepositoryPaginationModelType =
      await getDocumentsWithPagination<PostDocument>({
        query: rawQueryPaginationDTO,
        model: this.PostModel,
      });
    const getUserId = (): string => {
      if (accessToken) {
        const accessTokenPayload: JwtAccessTokenPayloadType | null =
          this.jwtHelpers.verifyAccessToken(accessToken);
        if (!accessTokenPayload) {
          return '';
        } else {
          return accessTokenPayload.userId;
        }
      } else {
        return '';
      }
    };
    const userId: string = getUserId();
    const apiPosts: PostApiModel[] = [];
    for (const postDocument of postsWithPagination.items) {
      const postReactionsCount: { likesCount: number; dislikesCount: number } =
        await this.likeQueryRepository.getEntityLikesCount(postDocument.id);
      const userLikeStatus: 'None' | 'Like' | 'Dislike' =
        await this.likeQueryRepository.getUserLikeStatus({
          userId,
          entityId: postDocument.id,
        });
      const lastLikes: Like[] =
        await this.likeQueryRepository.getEntityLastLikes(postDocument.id);
      const newestLikesArray: PostNewestLikeType[] = [];
      for (const rawLike of lastLikes) {
        const mappedLike: PostNewestLikeType = {
          addedAt: rawLike.addedAt,
          userId: rawLike.userId,
          login: rawLike.userLogin,
        };
        newestLikesArray.push(mappedLike);
      }
      const mappedPost: PostApiModel = {
        id: postDocument.id,
        title: postDocument.title,
        shortDescription: postDocument.shortDescription,
        content: postDocument.content,
        blogId: postDocument.blogId,
        blogName: postDocument.blogName,
        createdAt: postDocument.createdAt,
        extendedLikesInfo: {
          likesCount: postReactionsCount.likesCount,
          dislikesCount: postReactionsCount.dislikesCount,
          myStatus: userLikeStatus,
          newestLikes: newestLikesArray,
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
