import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  FindOperator,
  ILike,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { User } from '../../../../../libs/db/mongoose/schemes/user.entity';
import {
  UserEmailInfoType,
  UserPaginationViewModel,
  UserPasswordRecoveryInfoType,
  UserViewModel,
} from '../../api/models/user-api.models';
import { AuthApiUserInfoType } from '../../../../public-api/auth/api/models/auth-api.models';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { IUserApiPaginationQueryDto } from '../../api/models/user-api.query-dto';
import { UserEmailConfirmInfoSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/users/user-email-confirm-info-sql.entity';
import { UserPasswordRecoveryInfoSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/users/user-password-recovery-info-sql.entity';
import { UserSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/users/user-sql.entity';

@Injectable()
export class UserQueryRepositorySQL {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(UserEmailConfirmInfoSQLEntity)
    private readonly userEmailConfirmInfoEntity: Repository<UserEmailConfirmInfoSQLEntity>,
    @InjectRepository(UserPasswordRecoveryInfoSQLEntity)
    private readonly userPasswordRecoveryInfoEntity: Repository<UserPasswordRecoveryInfoSQLEntity>,
    @InjectRepository(UserSQLEntity)
    private readonly userEntity: Repository<UserSQLEntity>,
    private readonly jwtUtils: JwtUtils,
  ) {}

  async findUserWithSimilarLoginOrEmail(data: {
    login: string;
    email?: string;
  }): Promise<User | null> {
    const result: any[] = await this.dataSource.query(
      `
      SELECT u."id", u."login", u."email", u."password", u."created_at", u."is_banned", u."ban_reason", u."ban_date",
      ueci."confirmation_code" as "email_confirmation_code",
      ueci."expiration_date" as "email_confirmation_expiration_date",
      ueci."is_confirmed" as "email_confirmation_status",
      upri."recovery_code" as "password_recovery_code", upri."recovery_status" as "password_recovery_status"
      FROM public.users u
      JOIN public.users_email_confirmation_info ueci on ueci.user_id = u.id
      JOIN public.users_password_recovery_info upri on upri.user_id = u.id
      WHERE u.login = $1 OR u.email = $2
    `,
      [data.login, data.email],
    );
    if (result.length > 0) {
      const rawUser: any = result[0];
      const mappedUser: User = {
        id: String(rawUser.id),
        accountData: {
          login: rawUser.login,
          password: rawUser.password,
          email: rawUser.email,
          createdAt: rawUser.created_at,
        },
        banInfo: {
          isBanned: rawUser.is_banned,
          banReason: rawUser.ban_reason,
          banDate: rawUser.ban_date,
        },
        emailConfirmation: {
          isConfirmed: rawUser.email_confirmation_status,
          confirmationCode: rawUser.email_confirmation_code,
          expirationDate: rawUser.email_confirmation_expiration_date,
        },
        passwordRecovery: {
          recoveryStatus: rawUser.password_recovery_status,
          recoveryCode: rawUser.password_recovery_code,
        },
      };
      return mappedUser;
    } else {
      return null;
    }
  }

  async getUserEmailInfoByConfirmationCode(
    confirmationEmailCode: string,
  ): Promise<UserEmailInfoType | null> {
    const foundedInfo: UserEmailConfirmInfoSQLEntity | null =
      await this.userEmailConfirmInfoEntity.findOneBy({
        confirmationCode: confirmationEmailCode,
      });
    if (!foundedInfo) return null;
    const mappedInfo: UserEmailInfoType = {
      userId: foundedInfo.userId,
      confirmationCode: foundedInfo.confirmationCode,
      isConfirmed: foundedInfo.isConfirmed,
      expirationDate: foundedInfo.expirationDate,
    };
    return mappedInfo;
  }

  async getUserEmailConfirmInfoByEmail(
    email: string,
  ): Promise<UserEmailInfoType | null> {
    const queryBuilder: SelectQueryBuilder<UserEmailConfirmInfoSQLEntity> =
      await this.dataSource.createQueryBuilder();
    const result: UserEmailConfirmInfoSQLEntity | null = await queryBuilder
      .select('ueci')
      .from(UserEmailConfirmInfoSQLEntity, 'ueci')
      .where(
        'ueci."userId" = ' +
          queryBuilder
            .subQuery()
            .select('u.id')
            .from(UserSQLEntity, 'u')
            .where('u.email = :email')
            .getQuery(),
      )
      .setParameter('email', email)
      .getOne();
    if (!result) return null;
    const userEmailConfirmInfo: UserEmailInfoType = {
      userId: result.userId,
      confirmationCode: result.confirmationCode,
      expirationDate: result.expirationDate,
      isConfirmed: result.isConfirmed,
    };
    return userEmailConfirmInfo;
  }

  async getUserPasswordRecoveryInfoByRecoveryCode(
    recoveryCode: string,
  ): Promise<UserPasswordRecoveryInfoType | null> {
    const foundedInfo: UserPasswordRecoveryInfoSQLEntity | null =
      await this.userPasswordRecoveryInfoEntity.findOneBy({ recoveryCode });
    if (!foundedInfo) return null;
    const passwordRecoveryInfo: UserPasswordRecoveryInfoType = {
      userId: foundedInfo.userId,
      recoveryCode: foundedInfo.recoveryCode,
      recoveryStatus: foundedInfo.recoveryStatus,
    };
    return passwordRecoveryInfo;
  }

  async getInfoAboutUser(
    accessToken: string,
  ): Promise<AuthApiUserInfoType | null> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    if (!accessTokenPayload) {
      throw new UnauthorizedException();
    }
    const result: UserSQLEntity | null = await this.userEntity.findOneBy({
      id: Number(accessTokenPayload.userId),
    });
    if (!result) return null;
    const mappedUser: AuthApiUserInfoType = {
      userId: String(result.id),
      login: result.login,
      email: result.email,
    };
    return mappedUser;
  }

  async getUsersWithPagination(
    rawPaginationQuery: IUserApiPaginationQueryDto,
  ): Promise<UserPaginationViewModel> {
    const queryBuilder: SelectQueryBuilder<UserSQLEntity> =
      await this.dataSource.createQueryBuilder(UserSQLEntity, 'u');
    queryBuilder.select();
    const createCorrectOrderBy = (): void => {
      const sortDirection: 'ASC' | 'DESC' =
        rawPaginationQuery.sortDirection === 'asc' ? 'ASC' : 'DESC';
      switch (rawPaginationQuery.sortBy) {
        case 'login':
          queryBuilder.orderBy({ 'u.login': sortDirection });
          break;
        case 'email':
          queryBuilder.orderBy({ 'u.email': sortDirection });
          break;
        case 'createdAt':
          queryBuilder.orderBy({ 'u.createdAt': sortDirection });
          break;
      }
    };
    createCorrectOrderBy();
    const createCorrectFilter = (): void => {
      const filterQuery: Partial<
        Record<keyof UserSQLEntity, FindOperator<string>>
      >[] = [];
      switch (rawPaginationQuery.banStatus) {
        case 'banned':
          queryBuilder.where({ isBanned: true });
          break;
        case 'notBanned':
          queryBuilder.where({ isBanned: false });
          break;
      }
      if (rawPaginationQuery.searchLoginTerm) {
        filterQuery.push({
          login: ILike(`%${rawPaginationQuery.searchLoginTerm}%`),
        });
      }
      if (rawPaginationQuery.searchEmailTerm) {
        filterQuery.push({
          email: ILike(`%${rawPaginationQuery.searchEmailTerm}%`),
        });
      }
      if (filterQuery.length > 0) {
        queryBuilder.andWhere(filterQuery);
      }
    };
    createCorrectFilter();
    const howMuchToSkip: number =
      rawPaginationQuery.pageSize * (rawPaginationQuery.pageNumber - 1);
    queryBuilder.offset(howMuchToSkip);
    queryBuilder.limit(rawPaginationQuery.pageSize);
    const [foundedUsers, allUsersCount]: [UserSQLEntity[], number] =
      await queryBuilder.getManyAndCount();
    const pagesCount: number = Math.ceil(
      allUsersCount / rawPaginationQuery.pageSize,
    );
    const mappedUsers: UserViewModel[] = foundedUsers.map((rawUser) => {
      const mappedUser: UserViewModel = {
        id: String(rawUser.id),
        login: rawUser.login,
        email: rawUser.email,
        createdAt: rawUser.createdAt,
        banInfo: {
          isBanned: rawUser.isBanned,
          banDate: rawUser.banDate,
          banReason: rawUser.banReason,
        },
      };
      return mappedUser;
    });
    const usersPaginationResult: UserPaginationViewModel = {
      pagesCount: pagesCount,
      page: Number(rawPaginationQuery.pageNumber),
      pageSize: Number(rawPaginationQuery.pageSize),
      totalCount: Number(allUsersCount),
      items: mappedUsers,
    };
    return usersPaginationResult;
  }
}
