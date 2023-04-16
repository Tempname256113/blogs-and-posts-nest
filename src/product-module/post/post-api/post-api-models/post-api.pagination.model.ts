import { IPostApiModel } from './post-api.model';

export interface IPostApiPaginationModel {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: IPostApiModel[];
}
