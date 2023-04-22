import { PostDocumentType } from '../../../../product-domain/post/post.entity';

export interface IPostRepositoryPaginationModel {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: PostDocumentType[];
}
