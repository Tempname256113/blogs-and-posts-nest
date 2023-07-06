import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { exceptionFactoryFunction } from '../../../../../generic-factory-functions/exception-factory.function';
import { BloggerBlogQueryRepositorySQL } from '../../infrastructure/repositories/blog-blogger.query-repository-sql';
import { BloggerUserRepositorySQL } from '../../infrastructure/repositories/user-blogger.repository-sql';
import { BloggerUserQueryRepositorySQL } from '../../infrastructure/repositories/user-blogger.query-repository-sql';
import {
  BloggerRepositoryBannedUserType,
  BloggerRepositoryBlogType,
  BloggerRepositoryUserType,
} from '../../infrastructure/repositories/models/blogger-repository.models';

export class BanUserBloggerApiCommand {
  constructor(
    public readonly data: {
      bannedUserId: string;
      isBanned: boolean;
      banReason: string;
      blogId: string;
      accessToken: string;
    },
  ) {}
}

@CommandHandler(BanUserBloggerApiCommand)
export class BanUserBloggerApiUseCase
  implements ICommandHandler<BanUserBloggerApiCommand, void>
{
  constructor(
    private jwtUtils: JwtUtils,
    private readonly blogsQueryRepositorySQL: BloggerBlogQueryRepositorySQL,
    private readonly usersRepositorySQL: BloggerUserRepositorySQL,
    private readonly usersQueryRepositorySQL: BloggerUserQueryRepositorySQL,
  ) {}

  async execute({
    data: { bannedUserId, isBanned, banReason, blogId, accessToken },
  }: BanUserBloggerApiCommand): Promise<void> {
    const accessTokenPayload: JwtAccessTokenPayloadType =
      this.getAccessTokenPayload(accessToken);
    await this.checkBlogOwner({
      blogId,
      bloggerId: accessTokenPayload.userId,
    });
    if (isBanned) {
      await this.banUser({
        bannedUserId,
        blogId,
        banReason,
      });
    } else {
      await this.unBanUser({ bannedUserId, blogId });
    }
  }

  getAccessTokenPayload(accessToken: string): JwtAccessTokenPayloadType {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    if (!accessTokenPayload) {
      throw new UnauthorizedException();
    }
    return accessTokenPayload;
  }

  async checkBlogOwner({
    blogId,
    bloggerId,
  }: {
    blogId: string;
    bloggerId: string;
  }): Promise<void> {
    if (!Number(blogId) || !Number(bloggerId)) {
      throw new NotFoundException(['blogId']);
    }
    /* функция проверяет принадлежит предоставленный блог этому блогеру или нет */
    const foundedBlog: BloggerRepositoryBlogType | null =
      await this.blogsQueryRepositorySQL.getBlogByIdInternalUse(blogId);
    if (!foundedBlog) {
      throw new NotFoundException(exceptionFactoryFunction(['blogId']));
    }
    if (foundedBlog.bloggerId !== bloggerId) {
      throw new ForbiddenException(exceptionFactoryFunction(['blogId']));
    }
  }

  async banUser({
    bannedUserId,
    banReason,
    blogId,
  }: {
    bannedUserId: string;
    banReason: string;
    blogId: string;
  }): Promise<void> {
    const foundedBannedByBloggerUser: BloggerRepositoryBannedUserType | null =
      await this.usersQueryRepositorySQL.getBannedByBloggerUser({
        userId: bannedUserId,
        blogId,
      });
    if (foundedBannedByBloggerUser) return;
    const foundedUserForBan: BloggerRepositoryUserType | null =
      await this.usersQueryRepositorySQL.getUserById(bannedUserId);
    if (!foundedUserForBan) {
      throw new NotFoundException();
    }
    await this.usersRepositorySQL.banUser({
      userId: bannedUserId,
      blogId,
      banReason,
    });
  }

  async unBanUser({
    bannedUserId,
    blogId,
  }: {
    bannedUserId: string;
    blogId: string;
  }): Promise<void> {
    await this.usersRepositorySQL.unbanUser({ userId: bannedUserId, blogId });
  }
}
