import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Comment,
  CommentDocument,
  CommentSchema,
} from '../../../../../libs/db/mongoose/schemes/comment.entity';
import { FilterQuery, Model } from 'mongoose';
import { CommentApiPaginationQueryDto } from '../../api/models/comment-api.query-dto';
import {
  getPaginationUtils,
  PaginationUtilsType,
} from '../../../../modules/product/product-additional/get-documents-with-pagination.func';
import {
  CommentViewModel,
  CommentPaginationViewModel,
} from '../../api/models/comment-api.models';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { LikeQueryRepository } from '../../../like/infrastructure/repositories/like.query-repository';
import { EntityLikesCountType } from '../../../like/application/models/entity-likes-count.model';

@Injectable()
export class CommentQueryRepository {
  constructor(
    @InjectModel(CommentSchema.name) private CommentModel: Model<CommentSchema>,
    private jwtHelpers: JwtUtils,
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
  }): Promise<CommentPaginationViewModel> {
    const getUserId = (): number | null => {
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
    const userId: number = getUserId();
    const filter: FilterQuery<CommentSchema> = { postId, hidden: false };
    const allCommentsCount: number = await this.CommentModel.countDocuments(
      filter,
    );
    const additionalPaginationData: PaginationUtilsType = getPaginationUtils({
      pageSize: paginationQuery.pageSize,
      sortBy: paginationQuery.sortBy,
      totalDocumentsCount: allCommentsCount,
      pageNumber: paginationQuery.pageNumber,
      sortDirection: paginationQuery.sortDirection,
    });
    const foundedComments: Comment[] = await this.CommentModel.find(
      filter,
    ).lean();
    const arrayWithMappedComments: CommentViewModel[] = [];
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
      const mappedComment: CommentViewModel = {
        id: commentDocument.id,
        content: commentDocument.content,
        commentatorInfo: {
          userId: String(commentDocument.userId),
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
    const paginationResult: CommentPaginationViewModel = {
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
  }): Promise<CommentViewModel> {
    const getUserId = (): number | null => {
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
    const userId: number = getUserId();
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
    const mappedComment: CommentViewModel = {
      id: foundedComment.id,
      content: foundedComment.content,
      commentatorInfo: {
        userId: String(foundedComment.userId),
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

  async getRawCommentById(commentId: string): Promise<Comment | null> {
    return this.CommentModel.findOne({ id: commentId }).lean();
  }

  async getCommentDocumentById(
    commentId: string,
  ): Promise<CommentDocument | null> {
    return this.CommentModel.findOne({ id: commentId });
  }
}
