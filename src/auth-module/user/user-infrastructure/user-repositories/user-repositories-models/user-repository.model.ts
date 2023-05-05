import { UserDocument } from '../../../../../../libs/db/mongoose/schemes/user.entity';

export type UserRepositoryPaginationModelType = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: UserDocument[];
};
