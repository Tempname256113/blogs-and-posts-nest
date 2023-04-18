export interface IBlogApiPaginationQueryDTO {
  searchNameTerm: string | null;
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortDirection: string;
}
