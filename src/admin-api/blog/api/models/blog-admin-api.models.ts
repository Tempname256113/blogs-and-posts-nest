export type AdminApiBlogViewModel = {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
  blogOwnerInfo: {
    userId: string | null;
    userLogin: string | null;
  };
  // banInfo: {
  //   isBanned: boolean;
  //   banDate: string | null;
  // };
};

export type AdminApiBlogsPaginationModel = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: AdminApiBlogViewModel[];
};
