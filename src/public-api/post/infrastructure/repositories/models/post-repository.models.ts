import { PostDocument } from '../../../../../../libs/db/mongoose/schemes/post.entity';

export type PostRepositoryPaginationType = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: PostDocument[];
};
