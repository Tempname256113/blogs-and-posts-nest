import { PostDocument } from '../../../../product-domain/post-domain/post.entity';

export interface IPostRepositoryPaginationModel {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: PostDocument[];
}
