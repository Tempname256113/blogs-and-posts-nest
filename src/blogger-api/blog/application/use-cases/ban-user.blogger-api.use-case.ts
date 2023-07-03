import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { BlogDocument } from '../../../../../libs/db/mongoose/schemes/blog.entity';
import { Model } from 'mongoose';
import {
  BannedUserByBlogger,
  BannedUserByBloggerDocument,
  BannedUserByBloggerSchema,
} from '../../../../../libs/db/mongoose/schemes/banned-user-by-blogger.entity';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { exceptionFactoryFunction } from '../../../../../generic-factory-functions/exception-factory.function';
import {
  User,
  UserSchema,
} from '../../../../../libs/db/mongoose/schemes/user.entity';
import { BlogBloggerQueryRepository } from '../../infrastructure/repositories/blog-blogger.query-repository';

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
    @InjectModel(BannedUserByBloggerSchema.name)
    private BannedUserByBloggerModel: Model<BannedUserByBloggerSchema>,
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    private jwtUtils: JwtUtils,
    private blogsQueryRepository: BlogBloggerQueryRepository,
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
    /* функция проверяет принадлежит предоставленный блог этому блогеру или нет */
    const foundedBlog: BlogDocument | null =
      await this.blogsQueryRepository.getBlogById(blogId);
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
    const foundedBannedByBloggerUser: BannedUserByBlogger | null =
      await this.BannedUserByBloggerModel.findOne({
        userId: bannedUserId,
        blogId,
      }).lean();
    const foundedUserForBan: User | null = await this.UserModel.findOne({
      id: bannedUserId,
    }).lean();
    if (!foundedUserForBan) {
      throw new NotFoundException();
    }
    if (foundedBannedByBloggerUser) {
      return;
    } else {
      const newBannedUserByBlogger: BannedUserByBloggerDocument =
        new this.BannedUserByBloggerModel({
          userId: bannedUserId,
          userLogin: foundedUserForBan.accountData.login,
          banReason,
          blogId,
          banDate: new Date().toISOString(),
        });
      await newBannedUserByBlogger.save();
    }
  }

  async unBanUser({
    bannedUserId,
    blogId,
  }: {
    bannedUserId: string;
    blogId: string;
  }): Promise<void> {
    await this.BannedUserByBloggerModel.deleteOne({
      userId: bannedUserId,
      blogId,
    });
  }
}
