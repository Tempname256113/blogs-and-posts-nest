import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CommentSchema } from '../../../product-domain/comment.entity';
import { Model } from 'mongoose';
import { CommentApiPaginationQueryDto } from '../../comment-api/comment-api-models/comment-api.query-dto';
import { getDocumentsWithPagination } from '../../../product-additional/get-documents-with-pagination.func';

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
  }) {}
}
