import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PostDocument, PostSchema } from '../../../product-domain/post.entity';
import { Model } from 'mongoose';
import { PostRepositoryPaginationModelType } from './post-repositories-models/post-repository.models';
import { getDocumentsWithPagination } from '../../../product-additional/get-documents-with-pagination.func';
import {
  PostApiModel,
  PostApiPaginationModelType,
  PostNewestLikeType,
} from '../../post-api/post-api-models/post-api.models';
import { PostApiPaginationQueryDTOType } from '../../post-api/post-api-models/post-api.query-dto';
import { LikeService } from '../../../like/like.service';
import { JwtHelpers } from '../../../../app-helpers/jwt/jwt.helpers';
import { JwtAccessTokenPayloadType } from '../../../../app-models/jwt.payload.model';
import { Like } from '../../../product-domain/like.entity';

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    private likeService: LikeService,
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
      await this.likeService.getEntityLikesCount(postId);
    const postLastLikesAndUserLikeStatus: {
      userLikeStatus: 'None' | 'Like' | 'Dislike';
      lastLikes: Like[];
    } = await this.likeService.getEntityLastLikesAndUserLikeStatus({
      userId,
      entityId: postId,
      getLastLikes: true,
    });
    const foundedPost: PostDocument | null = await this.PostModel.findOne({
      id: postId,
    });
    if (!foundedPost) throw new NotFoundException();
    const newestLikesArray: PostNewestLikeType[] = [];
    for (const rawLike of postLastLikesAndUserLikeStatus.lastLikes) {
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
        myStatus: postLastLikesAndUserLikeStatus.userLikeStatus,
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
        await this.likeService.getEntityLikesCount(postDocument.id);
      const postLastLikesAndUserLikeStatus: {
        userLikeStatus: 'None' | 'Like' | 'Dislike';
        lastLikes: Like[];
      } = await this.likeService.getEntityLastLikesAndUserLikeStatus({
        userId,
        entityId: postDocument.id,
        getLastLikes: true,
      });
      const newestLikesArray: PostNewestLikeType[] = [];
      for (const rawLike of postLastLikesAndUserLikeStatus.lastLikes) {
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
          myStatus: postLastLikesAndUserLikeStatus.userLikeStatus,
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
