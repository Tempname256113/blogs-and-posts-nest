import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
    let filter = `bubb."blog_id" = ${blogId}`;
    if (paginationQuery.searchLoginTerm) {
      filter += ` AND u."login" ILIKE '%${paginationQuery.searchLoginTerm}%'`;
    }
    const bannedUsersForBlog: [{ count: number }] = await this.dataSource
      .query(`
    SELECT COUNT (*)
    FROM public.banned_users_by_blogger bubb
    JOIN public.users u on bubb."user_id" = u."id"
    WHERE ${filter}
    `);
    const allBannedUsersForBlogQuantity: number = bannedUsersForBlog[0].count;
    const howMuchToSkip: number =
      paginationQuery.pageSize * (paginationQuery.pageNumber - 1);
    const pagesCount: number = Math.ceil(
      allBannedUsersForBlogQuantity / paginationQuery.pageSize,
    );
    let orderBy = 'bubb."ban_date"';
    if (paginationQuery.sortBy === 'login') {
      orderBy = 'u."login"';
    }
    const allBannedUsersForBlog: any[] = await this.dataSource.query(`
    SELECT bubb."user_id", bubb."ban_reason", bubb."ban_date",
    u."login" as "user_login"
    FROM public.banned_users_by_blogger bubb
    JOIN public.users u on bubb."user_id" = u."id"
    WHERE ${filter}
    ORDER BY ${orderBy} ${paginationQuery.sortDirection.toUpperCase()}
    LIMIT ${paginationQuery.pageSize} OFFSET ${howMuchToSkip}
    `);
    const mappedBannedUsersForBlog: BannedUserBloggerApiViewModel[] =
      allBannedUsersForBlog.map((rawUserBanInfo) => {
        const mappedUser: BannedUserBloggerApiViewModel = {
          id: String(rawUserBanInfo.user_id),
          login: rawUserBanInfo.user_login,
          banInfo: {
            isBanned: true,
            banDate: rawUserBanInfo.ban_date,
            banReason: rawUserBanInfo.ban_reason,
          },
        };
        return mappedUser;
      });
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
