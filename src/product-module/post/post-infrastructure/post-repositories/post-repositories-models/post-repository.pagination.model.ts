import { PostDocumentType } from '../../../../product-domain/post/post.entity';

export type PostRepositoryPaginationModelType = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: PostDocumentType[];
};
