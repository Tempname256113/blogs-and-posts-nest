import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  UserDocument,
  UserSchema,
} from '../../../auth-domain/user/user.entity';
import { Model } from 'mongoose';
import { IUserApiPaginationQueryDto } from '../../user-api/user-api-models/user-api.query-dto';
import {
  IUserApiModel,
  IUserApiPaginationModel,
} from '../../user-api/user-api-models/user-api.models';
import {
  getDocumentsWithPagination,
  IPaginationQuery,
} from '../../../../product-module/product-additional/get-entity-with-pagination.func';
import { IUserRepositoryPaginationModel } from './user-repositories-models/user-repository.model';

@Injectable()
export class UserQueryRepository {
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
  ) {}
  async getUsersWithPagination(
    rawPaginationQuery: IUserApiPaginationQueryDto,
  ): Promise<IUserApiPaginationModel> {
    const paginationQuery: IPaginationQuery = {
      pageNumber: rawPaginationQuery.pageNumber,
      pageSize: rawPaginationQuery.pageSize,
      sortBy: rawPaginationQuery.sortBy,
      sortDirection: rawPaginationQuery.sortDirection,
    };
    const filter: { [prop: string]: string } = {};
    if (rawPaginationQuery.searchLoginTerm)
      filter.login = rawPaginationQuery.searchLoginTerm;
    if (rawPaginationQuery.searchEmailTerm)
      filter.email = rawPaginationQuery.searchEmailTerm;
    const usersWithPagination: IUserRepositoryPaginationModel =
      await getDocumentsWithPagination<UserDocument, UserSchema>(
        paginationQuery,
        this.UserModel,
        filter,
      );
    const mappedUsersArray: IUserApiModel[] = [];
    for (const userDocument of usersWithPagination.items) {
      const mappedUser: IUserApiModel = {
        id: userDocument.id,
        login: userDocument.login,
        email: userDocument.email,
        createdAt: userDocument.createdAt,
      };
      mappedUsersArray.push(mappedUser);
    }
    const usersPaginationResult: IUserApiPaginationModel = {
      pagesCount: usersWithPagination.pagesCount,
      page: usersWithPagination.page,
      pageSize: usersWithPagination.pageSize,
      totalCount: usersWithPagination.totalCount,
      items: mappedUsersArray,
    };
    return usersPaginationResult;
  }
}
