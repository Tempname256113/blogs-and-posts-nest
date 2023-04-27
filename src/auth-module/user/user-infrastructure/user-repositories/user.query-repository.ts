import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  User,
  UserDocument,
  UserSchema,
} from '../../../auth-module-domain/user/user.entity';
import { Model } from 'mongoose';
import { IUserApiPaginationQueryDto } from '../../user-api/user-api-models/user-api.query-dto';
import {
  UserApiModelType,
  UserApiPaginationModelType,
} from '../../user-api/user-api-models/user-api.models';
import {
  FilterType,
  getDocumentsWithPagination,
  PaginationQueryType,
} from '../../../../product-module/product-additional/get-documents-with-pagination.func';
import { UserRepositoryPaginationModelType } from './user-repositories-models/user-repository.model';
import { AuthApiUserInfoModelType } from '../../../auth/auth-api/auth-api-models/auth-api.models';

@Injectable()
export class UserQueryRepository {
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
  ) {}
  async getUsersWithPagination(
    rawPaginationQuery: IUserApiPaginationQueryDto,
  ): Promise<UserApiPaginationModelType> {
    let correctSortBy: string;
    switch (rawPaginationQuery.sortBy) {
      case 'login':
        correctSortBy = 'accountData.login';
        break;
      case 'email':
        correctSortBy = 'accountData.email';
        break;
      case 'password':
        correctSortBy = 'accountData.password';
        break;
      case 'createdAt':
        correctSortBy = 'accountData.createdAt';
        break;
    }
    const paginationQuery: PaginationQueryType = {
      pageNumber: rawPaginationQuery.pageNumber,
      pageSize: rawPaginationQuery.pageSize,
      sortBy: correctSortBy,
      sortDirection: rawPaginationQuery.sortDirection,
    };
    const filter: FilterType = [];
    if (rawPaginationQuery.searchLoginTerm) {
      filter.push({
        property: 'accountData.login',
        value: rawPaginationQuery.searchLoginTerm,
      });
    }
    if (rawPaginationQuery.searchEmailTerm) {
      filter.push({
        property: 'accountData.email',
        value: rawPaginationQuery.searchEmailTerm,
      });
    }
    const usersWithPagination: UserRepositoryPaginationModelType =
      await getDocumentsWithPagination<UserDocument, UserSchema>({
        query: paginationQuery,
        model: this.UserModel,
        rawFilter: filter,
      });
    const mappedUsersArray: UserApiModelType[] = [];
    for (const userDocument of usersWithPagination.items) {
      const mappedUser: UserApiModelType = {
        id: userDocument.id,
        login: userDocument.accountData?.login,
        email: userDocument.accountData?.email,
        createdAt: userDocument.accountData?.createdAt,
      };
      mappedUsersArray.push(mappedUser);
    }
    const usersPaginationResult: UserApiPaginationModelType = {
      pagesCount: usersWithPagination.pagesCount,
      page: usersWithPagination.page,
      pageSize: usersWithPagination.pageSize,
      totalCount: usersWithPagination.totalCount,
      items: mappedUsersArray,
    };
    return usersPaginationResult;
  }

  async getInfoAboutUser(
    userId: string,
  ): Promise<AuthApiUserInfoModelType | null> {
    const foundedUser: User | null = await this.UserModel.findOne({
      id: userId,
    });
    if (!foundedUser) return null;
    const mappedUser: AuthApiUserInfoModelType = {
      userId: foundedUser.id,
      login: foundedUser.accountData.login,
      email: foundedUser.accountData.email,
    };
    return mappedUser;
  }
}
