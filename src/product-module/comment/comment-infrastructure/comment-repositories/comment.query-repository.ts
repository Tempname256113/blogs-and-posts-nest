import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Comment,
  CommentDocument,
  CommentSchema,
} from '../../../../../libs/db/mongoose/schemes/comment.entity';
import { Model } from 'mongoose';
import { CommentApiPaginationQueryDto } from '../../comment-api/comment-api-models/comment-api.query-dto';
import { getDocumentsWithPagination } from '../../../product-additional/get-documents-with-pagination.func';
import { CommentRepositoryPaginationModel } from './comment-repositories-models/comment-repository.models';
import {
  CommentApiModel,
  CommentApiPaginationModel,
} from '../../comment-api/comment-api-models/comment-api.models';
import { JwtHelpers } from '../../../../../libs/auth/jwt/jwt-helpers.service';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { EntityLikesCountType } from '../../../like/like-application/like.service';
import { LikeQueryRepository } from '../../../like/like.query-repository';

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
    const getUserId = (): string => {
      if (accessToken) {
        const accessTokenPayload: JwtAccessTokenPayloadType | null =
          this.jwtHelpers.verifyAccessToken(accessToken);
        if (accessTokenPayload) {
          return accessTokenPayload.userId;
        } else {
          return '';
        }
      } else {
        return '';
      }
    };
    const userId: string = getUserId();
    const commentsWithPagination: CommentRepositoryPaginationModel =
      await getDocumentsWithPagination<CommentDocument>({
        query: paginationQuery,
        model: this.CommentModel,
        rawFilter: [{ property: 'postId', value: postId }],
      });
    const arrayWithMappedComments: CommentApiModel[] = [];
    for (const commentDocument of commentsWithPagination.items) {
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
      pagesCount: commentsWithPagination.pagesCount,
      page: commentsWithPagination.page,
      pageSize: commentsWithPagination.pageSize,
      totalCount: commentsWithPagination.totalCount,
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
    const getUserId = (): string => {
      if (accessToken) {
        const accessTokenPayload: JwtAccessTokenPayloadType | null =
          this.jwtHelpers.verifyAccessToken(accessToken);
        if (accessTokenPayload) {
          return accessTokenPayload.userId;
        } else {
          return '';
        }
      } else {
        return '';
      }
    };
    const userId: string = getUserId();
    const foundedComment: Comment | null = await this.CommentModel.findOne({
      id: commentId,
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
