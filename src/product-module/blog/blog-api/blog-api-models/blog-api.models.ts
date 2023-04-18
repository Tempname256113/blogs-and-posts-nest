export interface IBlogApiModel {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
}

export interface IBlogApiPaginationModel {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: IBlogApiModel[];
}
