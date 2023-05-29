import { CommentDocument } from '../../../../../../libs/db/mongoose/schemes/comment.entity';

export type CommentRepositoryPaginationModel = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: CommentDocument[];
};
