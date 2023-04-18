import { UserDocument } from '../../../../auth-domain/user/user.entity';

export interface IUserRepositoryPaginationModel {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: UserDocument[];
}
