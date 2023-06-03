export type UserApiModel = {
  id: string;
  login: string;
  email: string;
  createdAt: string;
  banInfo: {
    isBanned: boolean;
    banDate: Date | null;
    banReason: string | null;
  };
};

export type UserApiPaginationModel = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: UserApiModel[];
};
