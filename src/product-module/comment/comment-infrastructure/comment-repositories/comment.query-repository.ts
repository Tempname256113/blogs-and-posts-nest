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

@Injectable()
export class CommentQueryRepository {
  constructor(
    @InjectModel(CommentSchema.name) private CommentModel: Model<CommentSchema>,
  ) {}

  async getCommentsWithPagination({
    paginationQuery,
    postId,
  }: {
    paginationQuery: CommentApiPaginationQueryDto;
    postId: string;
  }): Promise<CommentApiPaginationModel> {
    const commentsWithPagination: CommentRepositoryPaginationModel =
      await getDocumentsWithPagination<CommentDocument>({
        query: paginationQuery,
        model: this.CommentModel,
        rawFilter: [{ property: 'postId', value: postId }],
      });
    const arrayWithMappedComments: CommentApiModel[] = [];
    for (const commentFromDB of commentsWithPagination.items) {
      const mappedComment: CommentApiModel = {
        id: commentFromDB.id,
        content: commentFromDB.content,
        commentatorInfo: {
          userId: commentFromDB.userId,
          userLogin: commentFromDB.userLogin,
        },
        createdAt: commentFromDB.createdAt,
        likesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
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
