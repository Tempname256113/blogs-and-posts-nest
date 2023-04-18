export interface IUserApiModel {
  id: string;
  login: string;
  email: string;
  createdAt: string;
}

export interface IUserApiPaginationModel {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: IUserApiModel[];
}
