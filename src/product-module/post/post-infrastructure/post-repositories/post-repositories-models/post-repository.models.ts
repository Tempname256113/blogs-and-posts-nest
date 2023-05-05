import { PostDocument } from '../../../../../../libs/db/mongoose/schemes/post.entity';

export type PostRepositoryPaginationModelType = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: PostDocument[];
};
