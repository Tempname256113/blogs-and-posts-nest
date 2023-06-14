export type BlogBloggerApiPaginationQueryDTO = {
  searchNameTerm: string | null;
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
};

export type CommentBloggerApiPaginationQueryDTO = {
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
};

export type BannedUsersBloggerApiPaginationQueryDTO = {
  searchLoginTerm: string | null;
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
};
