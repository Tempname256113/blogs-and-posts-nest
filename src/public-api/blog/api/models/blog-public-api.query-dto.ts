export type BlogPublicApiPaginationQueryDTO = {
  searchNameTerm: string | null;
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
};
