export interface IUserApiPaginationQueryDto {
  searchLoginTerm: string | null;
  searchEmailTerm: string | null;
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortDirection: string;
}
