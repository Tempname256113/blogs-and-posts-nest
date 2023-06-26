export type UserViewModel = {
  id: string;
  login: string;
  email: string;
  createdAt: string;
  banInfo: {
    isBanned: boolean;
    banDate: string | null;
    banReason: string | null;
  };
};

export type UserPaginationViewModel = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: UserViewModel[];
};

export type UserEmailInfoType = {
  userId: number;
  confirmationCode: string;
  expirationDate: string;
  isConfirmed: string;
};
