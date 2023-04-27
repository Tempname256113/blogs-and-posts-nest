import { PostDocument } from '../../../../product-domain/post.entity';

export type PostRepositoryPaginationModelType = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: PostDocument[];
};
