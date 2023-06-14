import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Post,
  PostDocument,
  PostSchema,
} from '../../../../../libs/db/mongoose/schemes/post.entity';
import { FilterQuery, Model } from 'mongoose';
import {
  PostApiModel,
  PostApiPaginationModelType,
  PostNewestLikeType,
} from '../../api/models/post-api.models';
import { PostApiPaginationQueryDTO } from '../../api/models/post-api.query-dto';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { Like } from '../../../../../libs/db/mongoose/schemes/like.entity';
import { LikeQueryRepository } from '../../../like/infrastructure/repositories/like.query-repository';
import {
  getPaginationUtils,
  PaginationUtilsType,
} from '../../../../modules/product/product-additional/get-documents-with-pagination.func';
import { EntityLikesCountType } from '../../../like/application/models/entity-likes-count.model';

@Injectable()
export class PostPublicQueryRepository {
  constructor(
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    private likeQueryRepository: LikeQueryRepository,
    private jwtHelpers: JwtUtils,
  ) {}
  async getPostById(
    postId: string,
    accessToken: string | null,
  ): Promise<PostApiModel | null> {
    const getUserId = (): string | null => {
      if (!accessToken) {
        return null;
      } else {
        const accessTokenPayload: JwtAccessTokenPayloadType | null =
          this.jwtHelpers.verifyAccessToken(accessToken);
        if (!accessToken) {
          return null;
        } else {
          return accessTokenPayload.userId;
        }
      }
    };
    const userId: string = getUserId();
    const postReactionsCount: { likesCount: number; dislikesCount: number } =
      await this.likeQueryRepository.getEntityLikesCount(postId);
    const foundedPost: PostDocument | null = await this.PostModel.findOne({
      id: postId,
      hidden: false,
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

  async getPostsWithPagination({
    rawPaginationQuery,
    accessToken,
  }: {
    rawPaginationQuery: PostApiPaginationQueryDTO;
    accessToken: string | null;
  }): Promise<PostApiPaginationModelType> {
    const getUserId = (): string | null => {
      if (!accessToken) {
        return null;
      } else {
        const accessTokenPayload: JwtAccessTokenPayloadType | null =
          this.jwtHelpers.verifyAccessToken(accessToken);
        if (!accessToken) {
          return null;
        } else {
          return accessTokenPayload.userId;
        }
      }
    };
    const userId: string | null = getUserId();
    const getPostsWithPagination =
      async (): Promise<PostApiPaginationModelType> => {
        const filter: FilterQuery<PostSchema> = { hidden: false };
        const totalPostsCount: number = await this.PostModel.countDocuments(
          filter,
        );
        const paginationHelpers: PaginationUtilsType = getPaginationUtils({
          pageSize: rawPaginationQuery.pageSize,
          sortBy: rawPaginationQuery.sortBy,
          totalDocumentsCount: totalPostsCount,
          sortDirection: rawPaginationQuery.sortDirection,
          pageNumber: rawPaginationQuery.pageNumber,
        });
        const foundedPosts: Post[] = await this.PostModel.find(
          filter,
          { _id: false },
          {
            limit: rawPaginationQuery.pageSize,
            skip: paginationHelpers.howMuchToSkip,
            sort: paginationHelpers.sortQuery,
          },
        ).lean();
        const mappedPosts: PostApiModel[] = [];
        for (const postDocument of foundedPosts) {
          const countOfReactions: EntityLikesCountType =
            await this.likeQueryRepository.getEntityLikesCount(postDocument.id);
          const userLikeStatus: 'Like' | 'Dislike' | 'None' =
            await this.likeQueryRepository.getUserLikeStatus({
              userId,
              entityId: postDocument.id,
            });
          const newestLikes: Like[] =
            await this.likeQueryRepository.getEntityLastLikes(postDocument.id);
          const mappedNewestLikes: PostNewestLikeType[] = [];
          for (const rawLike of newestLikes) {
            const mappedLike: PostNewestLikeType = {
              userId: rawLike.userId,
              login: rawLike.userLogin,
              addedAt: rawLike.addedAt,
            };
            mappedNewestLikes.push(mappedLike);
          }
          const resultPost: PostApiModel = {
            id: postDocument.id,
            title: postDocument.title,
            shortDescription: postDocument.shortDescription,
            content: postDocument.content,
            blogId: postDocument.blogId,
            blogName: postDocument.blogName,
            createdAt: postDocument.createdAt,
            extendedLikesInfo: {
              likesCount: countOfReactions.likesCount,
              dislikesCount: countOfReactions.dislikesCount,
              myStatus: userLikeStatus,
              newestLikes: mappedNewestLikes,
            },
          };
          mappedPosts.push(resultPost);
        }
        const resultPostsPagination: PostApiPaginationModelType = {
          pagesCount: paginationHelpers.pagesCount,
          page: rawPaginationQuery.pageNumber,
          pageSize: rawPaginationQuery.pageSize,
          totalCount: totalPostsCount,
          items: mappedPosts,
        };
        return resultPostsPagination;
      };
    return getPostsWithPagination();
  }

  async getRawPostById(postId: string): Promise<PostDocument | null> {
    return this.PostModel.findOne({ id: postId, hidden: false });
  }
}
