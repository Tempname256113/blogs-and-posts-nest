export type AdminApiUserViewModel = {
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

export type AdminApiUserPaginationViewModel = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: AdminApiUserViewModel[];
};

export type UserEmailInfoType = {
  userId: number;
  confirmationCode: string;
  expirationDate: string;
  isConfirmed: boolean;
};

export type UserPasswordRecoveryInfoType = {
  userId: number;
  recoveryCode: string | null;
  recoveryStatus: boolean;
};
