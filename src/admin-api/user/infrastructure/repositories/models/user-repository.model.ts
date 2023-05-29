import { UserDocument } from '../../../../../../libs/db/mongoose/schemes/user.entity';

export type UserRepositoryPaginationType = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: UserDocument[];
};
