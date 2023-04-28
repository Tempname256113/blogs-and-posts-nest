import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CommentDocument,
  CommentSchema,
} from '../../../product-domain/comment.entity';
import { Model } from 'mongoose';
import { CommentApiPaginationQueryDto } from '../../comment-api/comment-api-models/comment-api.query-dto';
import { getDocumentsWithPagination } from '../../../product-additional/get-documents-with-pagination.func';
import { CommentRepositoryPaginationModel } from './comment-repositories-models/comment-repository.models';
import {
  CommentApiModel,
  CommentApiPaginationModel,
} from '../../comment-api/comment-api-models/comment-api.models';
import { JwtHelpers } from '../../../../app-helpers/jwt/jwt-helpers.service';
import { JwtAccessTokenPayloadType } from '../../../../app-models/jwt.payload.model';
import { LikeService } from '../../../like/like.service';

@Injectable()
export class CommentQueryRepository {
  constructor(
    @InjectModel(CommentSchema.name) private CommentModel: Model<CommentSchema>,
    private jwtHelpers: JwtHelpers,
    private likeService: LikeService,
  ) {}

  async getCommentsWithPagination({
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
      } = await this.likeService.getEntityLikesCount(commentDocument.id);
      const userLikeStatus: 'None' | 'Like' | 'Dislike' =
        await this.likeService.getUserLikeStatus({
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
}
