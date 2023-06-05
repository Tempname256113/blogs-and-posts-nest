import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Comment,
  CommentSchema,
} from '../../../../../libs/db/mongoose/schemes/comment.entity';
import { FilterQuery, Model } from 'mongoose';
import { CommentApiPaginationQueryDto } from '../../api/models/comment-api.query-dto';
import {
  getPaginationHelpers,
  PaginationHelpersType,
} from '../../../../modules/product/product-additional/get-documents-with-pagination.func';
import {
  CommentApiModel,
  CommentApiPaginationModel,
} from '../../api/models/comment-api.models';
import { JwtHelpers } from '../../../../../libs/auth/jwt/jwt-helpers.service';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { LikeQueryRepository } from '../../../like/infrastructure/repositories/like.query-repository';
import { EntityLikesCountType } from '../../../like/application/models/entity-likes-count.model';

@Injectable()
export class CommentQueryRepository {
  constructor(
    @InjectModel(CommentSchema.name) private CommentModel: Model<CommentSchema>,
    private jwtHelpers: JwtHelpers,
    private likeQueryRepository: LikeQueryRepository,
  ) {}

  async getCommentsWithPaginationByPostId({
    paginationQuery,
    postId,
    accessToken,
  }: {
    paginationQuery: CommentApiPaginationQueryDto;
    postId: string;
    accessToken: string | null;
  }): Promise<CommentApiPaginationModel> {
    const getUserId = (): string | null => {
      if (!accessToken) {
        return null;
      } else {
        const accessTokenPayload: JwtAccessTokenPayloadType | null =
          this.jwtHelpers.verifyAccessToken(accessToken);
        if (!accessTokenPayload) {
          return null;
        } else {
          return accessTokenPayload.userId;
        }
      }
    };
    const userId: string = getUserId();
    const filter: FilterQuery<CommentSchema> = { postId, hidden: false };
    const allCommentsCount: number = await this.CommentModel.countDocuments(
      filter,
    );
    const additionalPaginationData: PaginationHelpersType =
      getPaginationHelpers({
        pageSize: paginationQuery.pageSize,
        sortBy: paginationQuery.sortBy,
        totalDocumentsCount: allCommentsCount,
        pageNumber: paginationQuery.pageNumber,
        sortDirection: paginationQuery.sortDirection,
      });
    const foundedComments: Comment[] = await this.CommentModel.find(
      filter,
    ).lean();
    const arrayWithMappedComments: CommentApiModel[] = [];
    for (const commentDocument of foundedComments) {
      const commentReactionsCount: {
        likesCount: number;
        dislikesCount: number;
      } = await this.likeQueryRepository.getEntityLikesCount(
        commentDocument.id,
      );
      const userLikeStatus: 'None' | 'Like' | 'Dislike' =
        await this.likeQueryRepository.getUserLikeStatus({
          userId,
          entityId: commentDocument.id,
        });
      const mappedComment: CommentApiModel = {
        id: commentDocument.id,
        content: commentDocument.content,
        commentatorInfo: {
          userId: commentDocument.userId,
          userLogin: commentDocument.userLogin,
        },
        createdAt: commentDocument.createdAt,
        likesInfo: {
          likesCount: commentReactionsCount.likesCount,
          dislikesCount: commentReactionsCount.dislikesCount,
          myStatus: userLikeStatus,
        },
      };
      arrayWithMappedComments.push(mappedComment);
    }
    const paginationResult: CommentApiPaginationModel = {
      pagesCount: additionalPaginationData.pagesCount,
      page: paginationQuery.pageNumber,
      pageSize: paginationQuery.pageSize,
      totalCount: allCommentsCount,
      items: arrayWithMappedComments,
    };
    return paginationResult;
  }

  async getCommentById({
    commentId,
    accessToken,
  }: {
    commentId: string;
    accessToken: string | null;
  }): Promise<CommentApiModel> {
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
    const foundedComment: Comment | null = await this.CommentModel.findOne({
      id: commentId,
      hidden: false,
    }).lean();
    if (!foundedComment) throw new NotFoundException();
    const commentReactionsCount: EntityLikesCountType =
      await this.likeQueryRepository.getEntityLikesCount(commentId);
    const userLikeInfo: 'Like' | 'Dislike' | 'None' =
      await this.likeQueryRepository.getUserLikeStatus({
        userId,
        entityId: commentId,
      });
    const mappedComment: CommentApiModel = {
      id: foundedComment.id,
      content: foundedComment.content,
      commentatorInfo: {
        userId: foundedComment.userId,
        userLogin: foundedComment.userLogin,
      },
      createdAt: foundedComment.createdAt,
      likesInfo: {
        likesCount: commentReactionsCount.likesCount,
        dislikesCount: commentReactionsCount.dislikesCount,
        myStatus: userLikeInfo,
      },
    };
    return mappedComment;
  }
}
