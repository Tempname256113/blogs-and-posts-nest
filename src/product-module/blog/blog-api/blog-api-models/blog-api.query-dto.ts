export type BlogApiPaginationQueryDTOType = {
  searchNameTerm: string | null;
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortDirection: string;
};
