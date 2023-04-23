export type UserApiModelType = {
  id: string;
  login: string;
  email: string;
  createdAt: string;
};

export type UserApiPaginationModelType = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: UserApiModelType[];
};
