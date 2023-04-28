import { UserDocument } from '../../../../auth-domain/user.entity';

export type UserRepositoryPaginationModelType = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: UserDocument[];
};
