import { PostDocument } from '../../../post-api/post-application/post-domain/post.entity';

export interface IPostRepositoryPaginationModel {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: PostDocument[];
}
