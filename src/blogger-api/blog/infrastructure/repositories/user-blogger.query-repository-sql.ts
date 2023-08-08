import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  BloggerRepositoryBannedUserType,
  BloggerRepositoryBlogType,
  BloggerRepositoryUserType,
} from './models/blogger-repository.models';
import { BannedUsersBloggerApiPaginationQueryDTO } from '../../api/models/blog-blogger-api.query-dto';
import {
  BannedUserBloggerApiViewModel,
  BannedUsersBloggerApiPaginationViewModel,
} from '../../api/models/blog-blogger-api.models';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { BloggerBlogQueryRepositorySQL } from './blog-blogger.query-repository-sql';
import { BannedUsersByBloggerSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/users/banned-users-by-blogger-sql.entity';
import { UserSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/users/user-sql.entity';

@Injectable()
export class BloggerUserQueryRepositorySQL {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(BannedUsersByBloggerSQLEntity)
    private readonly bannedUsersByBloggerEntity: Repository<BannedUsersByBloggerSQLEntity>,
    @InjectRepository(UserSQLEntity)
    private readonly userEntity: Repository<UserSQLEntity>,
    private readonly jwtUtils: JwtUtils,
    private readonly blogQueryRepositorySQL: BloggerBlogQueryRepositorySQL,
  ) {}

  async getBannedByBloggerUser({
    userId,
    blogId,
  }: {
    userId: string;
    blogId: string;
  }): Promise<BloggerRepositoryBannedUserType | null> {
    const foundedBannedUser: BannedUsersByBloggerSQLEntity | null =
      await this.bannedUsersByBloggerEntity.findOneBy({
        userId: Number(userId),
        blogId: Number(blogId),
      });
    if (!foundedBannedUser) return null;
    return {
      userId: String(foundedBannedUser.userId),
      blogId: String(foundedBannedUser.blogId),
      banReason: foundedBannedUser.banReason,
      banDate: foundedBannedUser.banDate,
    };
  }

  async getUserById(userId: string): Promise<BloggerRepositoryUserType | null> {
    const foundedUser: UserSQLEntity | null = await this.userEntity.findOneBy({
      id: Number(userId),
    });
    if (!foundedUser) return null;
    return {
      id: String(foundedUser.id),
      login: foundedUser.login,
      email: foundedUser.email,
      createdAt: foundedUser.createdAt,
    };
  }

  async getAllBannedUsersForBlog({
    paginationQuery,
    blogId,
    accessToken,
  }: {
    paginationQuery: BannedUsersBloggerApiPaginationQueryDTO;
    blogId: string;
    accessToken: string;
  }): Promise<BannedUsersBloggerApiPaginationViewModel> {
    if (!Number(blogId)) {
      throw new NotFoundException();
    }
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    if (!accessTokenPayload) {
      throw new UnauthorizedException();
    }
    const checkBlogOwner = async () => {
      const foundedBlog: BloggerRepositoryBlogType | null =
        await this.blogQueryRepositorySQL.getBlogByIdInternalUse(blogId);
      if (!foundedBlog) {
        throw new NotFoundException();
      }
      if (foundedBlog.bloggerId !== accessTokenPayload.userId) {
        throw new ForbiddenException();
      }
    };
    await checkBlogOwner();
    let filter = `bu.blogId = :blogId`;
    if (paginationQuery.searchLoginTerm) {
      filter += ` AND u.login ILIKE '%${paginationQuery.searchLoginTerm}%'`;
    }
    const getBannedUsersQuantity = async (): Promise<number> => {
      const queryBuilder: SelectQueryBuilder<BannedUsersByBloggerSQLEntity> =
        await this.dataSource.createQueryBuilder(
          BannedUsersByBloggerSQLEntity,
          'bu',
        );
      return queryBuilder
        .innerJoin(UserSQLEntity, 'u', 'bu.userId = u.id')
        .where(filter, { blogId })
        .getCount();
    };
    const getRawBannedUsers = async (): Promise<
      {
        bu_userId: number;
        bu_banReason: string;
        bu_banDate: string;
        u_login: string;
      }[]
    > => {
      const queryBuilder: SelectQueryBuilder<BannedUsersByBloggerSQLEntity> =
        await this.dataSource.createQueryBuilder(
          BannedUsersByBloggerSQLEntity,
          'bu',
        );
      let orderBy = 'bu.banDate';
      if (paginationQuery.sortBy === 'login') {
        orderBy = 'u.login';
      }
      const howMuchToSkip: number =
        paginationQuery.pageSize * (paginationQuery.pageNumber - 1);
      const correctOrderDirection: 'ASC' | 'DESC' =
        paginationQuery.sortDirection === 'asc' ? 'ASC' : 'DESC';
      return queryBuilder
        .select(['bu.userId', 'bu.banReason', 'bu.banDate', 'u.login'])
        .innerJoin(UserSQLEntity, 'u', 'bu.userId = u.id')
        .where(filter, { blogId })
        .orderBy(orderBy, correctOrderDirection)
        .limit(paginationQuery.pageSize)
        .offset(howMuchToSkip)
        .getRawMany();
    };
    const allBannedUsersForBlog: Awaited<ReturnType<typeof getRawBannedUsers>> =
      await getRawBannedUsers();
    const mappedBannedUsersForBlog: BannedUserBloggerApiViewModel[] =
      allBannedUsersForBlog.map((rawUserBanInfo) => {
        const mappedUser: BannedUserBloggerApiViewModel = {
          id: String(rawUserBanInfo.bu_userId),
          login: rawUserBanInfo.u_login,
          banInfo: {
            isBanned: true,
            banDate: rawUserBanInfo.bu_banDate,
            banReason: rawUserBanInfo.bu_banReason,
          },
        };
        return mappedUser;
      });
    const allBannedUsersForBlogQuantity: number =
      await getBannedUsersQuantity();
    const pagesCount: number = Math.ceil(
      allBannedUsersForBlogQuantity / paginationQuery.pageSize,
    );
    const paginationResult: BannedUsersBloggerApiPaginationViewModel = {
      pagesCount: Number(pagesCount),
      page: Number(paginationQuery.pageNumber),
      pageSize: Number(paginationQuery.pageSize),
      totalCount: Number(allBannedUsersForBlogQuantity),
      items: mappedBannedUsersForBlog,
    };
    return paginationResult;
  }
}
