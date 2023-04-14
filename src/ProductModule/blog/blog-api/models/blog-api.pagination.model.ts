import { IBlogApiModel } from './blog-api.model';

export interface IBlogPaginationModel {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: IBlogApiModel[];
}
