import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
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

@Injectable()
export class UserQueryRepositorySQL {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly jwtUtils: JwtUtils,
  ) {}

  async findUserWithSimilarLoginOrEmail(data: {
    login: string;
    email: string;
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
        id: rawUser.id,
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
    const result: any[] = await this.dataSource.query(
      `
    SELECT ueci.user_id, ueci.confirmation_code, ueci.expiration_date, ueci.is_confirmed
    FROM public.users_email_confirmation_info ueci
    WHERE ueci.confirmation_code = $1
    `,
      [confirmationEmailCode],
    );
    if (result.length > 0) {
      const res = result[0];
      const userEmailInfo: UserEmailInfoType = {
        userId: res.user_id,
        confirmationCode: res.confirmation_code,
        expirationDate: res.expiration_date,
        isConfirmed: res.is_confirmed,
      };
      return userEmailInfo;
    } else {
      return null;
    }
  }

  async getUserEmailInfoByEmail(
    email: string,
  ): Promise<UserEmailInfoType | null> {
    const result: any[] = await this.dataSource.query(
      `
    SELECT ueci.user_id, ueci.confirmation_code, ueci.expiration_date, ueci.is_confirmed
    FROM public.users_email_confirmation_info ueci
    WHERE ueci.user_id = (select "id" from public.users u where u.email = $1)
    `,
      [email],
    );
    if (result.length > 0) {
      const res = result[0];
      const userEmailInfo: UserEmailInfoType = {
        userId: res.user_id,
        confirmationCode: res.confirmation_code,
        expirationDate: res.expiration_date,
        isConfirmed: res.is_confirmed,
      };
      return userEmailInfo;
    } else {
      return null;
    }
  }

  async getUserPasswordRecoveryInfoByRecoveryCode(
    recoveryCode: string,
  ): Promise<UserPasswordRecoveryInfoType | null> {
    const result: any[] = await this.dataSource.query(
      `
    SELECT p.user_id, p.recovery_code, p.recovery_status
    FROM public.users_password_recovery_info p
    WHERE "recovery_code" = $1
    `,
      [recoveryCode],
    );
    if (result.length > 0) {
      const res: any = result[0];
      const passwordRecoveryInfo: UserPasswordRecoveryInfoType = {
        userId: res.user_id,
        recoveryCode: res.recovery_code,
        recoveryStatus: res.recovery_status,
      };
      return passwordRecoveryInfo;
    } else {
      return null;
    }
  }

  async getInfoAboutUser(
    accessToken: string,
  ): Promise<AuthApiUserInfoType | null> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    if (!accessTokenPayload) {
      throw new UnauthorizedException();
    }
    const result: any[] = await this.dataSource.query(
      `
    SELECT u.id, u.login, u.email
    FROM public.users u
    WHERE u.id = $1
    `,
      [accessTokenPayload.userId],
    );
    if (result.length < 1) return null;
    const res: any = result[0];
    const mappedUser: AuthApiUserInfoType = {
      userId: res.id,
      login: res.login,
      email: res.email,
    };
    return mappedUser;
  }

  async getUsersWithPagination(
    rawPaginationQuery: IUserApiPaginationQueryDto,
  ): Promise<UserPaginationViewModel> {
    let correctSortBy: string = rawPaginationQuery.sortBy;
    switch (rawPaginationQuery.sortBy) {
      case 'login':
        correctSortBy = 'u.login';
        break;
      case 'email':
        correctSortBy = 'u.email';
        break;
      case 'createdAt':
        correctSortBy = 'u.created_at';
        break;
    }
    let correctBanStatus: string = rawPaginationQuery.banStatus;
    switch (rawPaginationQuery.banStatus) {
      case 'all':
        correctBanStatus = 'u.is_banned = true OR u.is_banned = false';
        break;
      case 'banned':
        correctBanStatus = 'u.is_banned = true';
        break;
      case 'notBanned':
        correctBanStatus = 'u.is_banned = false';
        break;
    }
    let correctSearchTerm: string | null = null;
    const createCorrectFilter = (): void => {
      if (
        rawPaginationQuery.searchLoginTerm ||
        rawPaginationQuery.searchEmailTerm
      ) {
        correctSearchTerm = '';
        if (rawPaginationQuery.searchLoginTerm) {
          correctSearchTerm += `u.login ILIKE %${rawPaginationQuery.searchLoginTerm}%`;
        }
        if (rawPaginationQuery.searchEmailTerm) {
          if (correctSearchTerm) {
            correctSearchTerm += ` AND u.email ILIKE %${rawPaginationQuery.searchEmailTerm}%`;
          } else {
            correctSearchTerm += `u.email ILIKE %${rawPaginationQuery.searchEmailTerm}%`;
          }
        }
      }
    };
    createCorrectFilter();
    const getAllUsersCount = async (): Promise<number> => {
      if (correctSearchTerm) {
        const result: any[] = await this.dataSource.query(`
        SELECT COUNT(*) FROM public.users u
        WHERE ${correctSearchTerm} AND ${correctBanStatus}
        `);
        return result[0].count;
      } else {
        const result: any[] = await this.dataSource.query(`
        SELECT COUNT(*) FROM public.users u
        WHERE ${correctBanStatus}
        `);
        return result[0].count;
      }
    };
    const allUsersCount: number = await getAllUsersCount();
    const howMuchToSkip: number =
      rawPaginationQuery.pageSize * (rawPaginationQuery.pageNumber - 1);
    const pagesCount: number = Math.ceil(
      allUsersCount / rawPaginationQuery.pageSize,
    );
    const getRawUsers = async (): Promise<any[]> => {
      if (correctSearchTerm) {
        return this.dataSource.query(`
        SELECT u.id, u.login, u.email, u.created_at, u.is_banned, u.ban_date, u.ban_reason
        FROM public.users u
        WHERE ${correctSearchTerm} AND ${correctBanStatus}
        ORDER BY ${correctSortBy} ${rawPaginationQuery.sortDirection.toUpperCase()}
        LIMIT ${rawPaginationQuery.pageSize} OFFSET ${howMuchToSkip}
        `);
      } else {
        return this.dataSource.query(`
        SELECT u.id, u.login, u.email, u.created_at, u.is_banned, u.ban_date, u.ban_reason
        FROM public.users u 
        WHERE ${correctBanStatus}
        ORDER BY ${correctSortBy} ${rawPaginationQuery.sortDirection.toUpperCase()}
        LIMIT ${rawPaginationQuery.pageSize} OFFSET ${howMuchToSkip}
        `);
      }
    };
    const foundedUsers: any[] = await getRawUsers();
    const mappedUsers: UserViewModel[] = foundedUsers.map((rawUser) => {
      const mappedUser: UserViewModel = {
        id: String(rawUser.id),
        login: rawUser.login,
        email: rawUser.email,
        createdAt: rawUser.created_at,
        banInfo: {
          isBanned: rawUser.is_banned,
          banDate: rawUser.ban_date,
          banReason: rawUser.ban_reason,
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
