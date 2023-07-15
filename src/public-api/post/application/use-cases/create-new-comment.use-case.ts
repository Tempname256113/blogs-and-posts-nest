import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentViewModel } from '../../../comment/api/models/comment-api.models';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { UserQueryRepositorySQL } from '../../../../admin-api/user/infrastructure/repositories/user.query-repository-sql';
import { User } from '../../../../../libs/db/mongoose/schemes/user.entity';
import { BloggerUserQueryRepositorySQL } from '../../../../blogger-api/blog/infrastructure/repositories/user-blogger.query-repository-sql';
import { BloggerRepositoryBannedUserType } from '../../../../blogger-api/blog/infrastructure/repositories/models/blogger-repository.models';
import { PublicCommentRepositorySQL } from '../../../comment/infrastructure/repositories/comment-public.repository-sql';
import { PublicPostQueryRepositorySQL } from '../../infrastructure/repositories/post-public.query-repository-sql';
import { PostViewModel } from '../../api/models/post-api.models';

export class CreateNewCommentCommand {
  constructor(
    public readonly data: {
      accessToken: string;
      content: string;
      postId: string;
    },
  ) {}
}

@CommandHandler(CreateNewCommentCommand)
export class CreateNewCommentUseCase
  implements ICommandHandler<CreateNewCommentCommand, CommentViewModel>
{
  constructor(
    private readonly usersAdminApiQueryRepositorySQL: UserQueryRepositorySQL,
    private readonly usersBloggerApiQueryRepositorySQL: BloggerUserQueryRepositorySQL,
    private readonly commentsPublicApiRepositorySQL: PublicCommentRepositorySQL,
    private readonly postsPublicApiRepositorySQL: PublicPostQueryRepositorySQL,
    private jwtUtils: JwtUtils,
  ) {}

  async execute({
    data: { accessToken, content, postId },
  }: CreateNewCommentCommand): Promise<CommentViewModel> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.getAccessTokenPayload(accessToken);
    const userId: string = accessTokenPayload.userId;
    const userLogin: string = accessTokenPayload.userLogin;
    const foundedPost: PostViewModel = await this.getPostById({
      postId,
      accessToken,
    });
    await this.checkUserBannedByBloggerOrNot({
      userId,
      blogId: foundedPost.blogId,
    });
    await this.checkUserBannedOrNot(userLogin);
    return this.createComment({
      postId,
      userId,
      userLogin,
      content,
    });
  }

  async getPostById({
    postId,
    accessToken,
  }: {
    postId: string;
    accessToken: string;
  }): Promise<PostViewModel> {
    const foundedPost: PostViewModel | null =
      await this.postsPublicApiRepositorySQL.getPostById({
        postId,
        accessToken,
      });
    if (!foundedPost) throw new NotFoundException();
    return foundedPost;
  }

  async createComment({
    postId,
    userId,
    userLogin,
    content,
  }: {
    postId: string;
    userId: string;
    userLogin: string;
    content: string;
  }): Promise<CommentViewModel> {
    const newCreatedCommentData =
      await this.commentsPublicApiRepositorySQL.createNewComment({
        postId,
        userId,
        content,
      });
    const mappedComment: CommentViewModel = {
      id: String(newCreatedCommentData.createdCommentId),
      content,
      commentatorInfo: {
        userId: String(userId),
        userLogin,
      },
      createdAt: newCreatedCommentData.commentCreatedAt,
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
      },
    };
    return mappedComment;
  }

  getAccessTokenPayload(accessToken): JwtAccessTokenPayloadType {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    if (!accessTokenPayload) {
      throw new UnauthorizedException();
    }
    return accessTokenPayload;
  }

  async checkUserBannedByBloggerOrNot({
    userId,
    blogId,
  }: {
    userId: string;
    blogId: string;
  }): Promise<void> {
    const foundedBannedUserByBlogger: BloggerRepositoryBannedUserType | null =
      await this.usersBloggerApiQueryRepositorySQL.getBannedByBloggerUser({
        userId,
        blogId,
      });
    if (foundedBannedUserByBlogger) {
      throw new ForbiddenException();
    }
  }

  async checkUserBannedOrNot(userLogin: string): Promise<void> {
    const foundedUser: User | null =
      await this.usersAdminApiQueryRepositorySQL.findUserWithSimilarLoginOrEmail(
        {
          login: userLogin,
        },
      );
    if (foundedUser.banInfo.isBanned) {
      throw new ForbiddenException();
    }
  }
}
