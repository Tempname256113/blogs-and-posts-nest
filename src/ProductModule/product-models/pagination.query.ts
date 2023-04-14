export interface IPaginationQuery {
  searchNameTerm: string | null;
  sortBy: string;
  sortDirection: string;
  pageNumber: number;
  pageSize: number;
}
