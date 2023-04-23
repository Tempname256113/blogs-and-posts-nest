import { UserDocument } from '../../../../auth-module-domain/user/user.entity';

export type UserRepositoryPaginationModelType = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: UserDocument[];
};
