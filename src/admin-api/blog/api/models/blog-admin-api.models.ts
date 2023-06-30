export type BlogAdminApiModel = {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
  blogOwnerInfo: {
    userId: number;
    userLogin: string;
  };
  banInfo: {
    isBanned: boolean;
    banDate: string;
  };
};

export type BlogAdminApiPaginationModel = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: BlogAdminApiModel[];
};
