import { CommentDocument } from '../../../../product-domain/comment.entity';

export type CommentRepositoryPaginationModel = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: CommentDocument[];
};
