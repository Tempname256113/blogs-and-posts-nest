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
  getDocumentsWithPagination,
  IPaginationQuery,
} from '../../../../product-module/product-additional/get-entity-with-pagination.func';
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
    const paginationQuery: IPaginationQuery = {
      pageNumber: rawPaginationQuery.pageNumber,
      pageSize: rawPaginationQuery.pageSize,
      sortBy: rawPaginationQuery.sortBy,
      sortDirection: rawPaginationQuery.sortDirection,
    };
    const filter: { [prop: string]: string } = {};
    if (rawPaginationQuery.searchLoginTerm)
      filter['accountData.login'] = rawPaginationQuery.searchLoginTerm;
    if (rawPaginationQuery.searchEmailTerm)
      filter['accountData.email'] = rawPaginationQuery.searchEmailTerm;
    const usersWithPagination: UserRepositoryPaginationModelType =
      await getDocumentsWithPagination<UserDocument, UserSchema>(
        paginationQuery,
        this.UserModel,
        filter,
      );
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
