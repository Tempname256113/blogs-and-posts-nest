export type UserPaginationQueryDto = {
  searchLoginTerm: string | null;
  searchEmailTerm: string | null;
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  banStatus: 'all' | 'banned' | 'notBanned';
};
