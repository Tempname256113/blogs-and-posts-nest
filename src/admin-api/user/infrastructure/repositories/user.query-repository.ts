import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  User,
  UserSchema,
} from '../../../../../libs/db/mongoose/schemes/user.entity';
import { FilterQuery, Model } from 'mongoose';
import { IUserApiPaginationQueryDto } from '../../api/models/user-api.query-dto';
import {
  UserApiModel,
  UserApiPaginationModel,
} from '../../api/models/user-api.models';
import {
  getPaginationUtils,
  PaginationUtilsType,
} from '../../../../modules/product/product-additional/get-documents-with-pagination.func';
import { AuthApiUserInfoType } from '../../../../public-api/auth/api/models/auth-api.models';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';

@Injectable()
export class UserQueryRepository {
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    private jwtHelpers: JwtUtils,
  ) {}
  async getUsersWithPagination(
    rawPaginationQuery: IUserApiPaginationQueryDto,
  ): Promise<UserApiPaginationModel> {
    let correctSortBy: string = rawPaginationQuery.sortBy;
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
    let filter: FilterQuery<UserSchema> = {
      $or: [],
    };
    const createCorrectFilter = (): void => {
      switch (rawPaginationQuery.banStatus) {
        case 'banned':
          filter.$or.push({ 'banStatus.banned': true });
          break;
        case 'notBanned':
          filter.$or.push({ 'banStatus.banned': false });
          break;
      }
      if (rawPaginationQuery.searchLoginTerm) {
        filter.$or.push({
          'accountData.login': {
            $regex: rawPaginationQuery.searchLoginTerm,
            $options: 'i',
          },
        });
      }
      if (rawPaginationQuery.searchEmailTerm) {
        filter.$or.push({
          'accountData.email': {
            $regex: rawPaginationQuery.searchEmailTerm,
            $options: 'i',
          },
        });
      }
    };
    createCorrectFilter();
    if (filter.$or.length < 1) {
      filter = {};
    }
    const allUsersCount: number = await this.UserModel.countDocuments(filter);
    const additionalPaginationData: PaginationUtilsType = getPaginationUtils({
      sortDirection: rawPaginationQuery.sortDirection,
      sortBy: correctSortBy,
      pageSize: rawPaginationQuery.pageSize,
      pageNumber: rawPaginationQuery.pageNumber,
      totalDocumentsCount: allUsersCount,
    });
    const foundedUsers: User[] = await this.UserModel.find(
      filter,
      { _id: false },
      {
        limit: rawPaginationQuery.pageSize,
        skip: additionalPaginationData.howMuchToSkip,
        sort: additionalPaginationData.sortQuery,
      },
    ).lean();
    const mappedUsers: UserApiModel[] = foundedUsers.map((rawUser) => {
      const mappedUser: UserApiModel = {
        id: rawUser.id,
        login: rawUser.accountData.login,
        email: rawUser.accountData.email,
        createdAt: rawUser.accountData.createdAt,
        banInfo: {
          isBanned: rawUser.banStatus.banned,
          banDate: rawUser.banStatus.banDate,
          banReason: rawUser.banStatus.banReason,
        },
      };
      return mappedUser;
    });
    const usersPaginationResult: UserApiPaginationModel = {
      pagesCount: Number(additionalPaginationData.pagesCount),
      page: Number(rawPaginationQuery.pageNumber),
      pageSize: Number(rawPaginationQuery.pageSize),
      totalCount: allUsersCount,
      items: mappedUsers,
    };
    return usersPaginationResult;
  }

  async getInfoAboutUser(
    accessToken: string,
  ): Promise<AuthApiUserInfoType | null> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtHelpers.verifyAccessToken(accessToken);
    if (!accessTokenPayload) {
      throw new UnauthorizedException();
    }
    const foundedUser: User | null = await this.UserModel.findOne({
      id: accessTokenPayload.userId,
    });
    if (!foundedUser) return null;
    const mappedUser: AuthApiUserInfoType = {
      userId: foundedUser.id,
      login: foundedUser.accountData.login,
      email: foundedUser.accountData.email,
    };
    return mappedUser;
  }
}
