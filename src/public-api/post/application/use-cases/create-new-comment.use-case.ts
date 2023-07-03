import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentViewModel } from '../../../comment/api/models/comment-api.models';
import {
  PostDocument,
  PostSchema,
} from '../../../../../libs/db/mongoose/schemes/post.entity';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Comment,
  CommentDocument,
  CommentSchema,
} from '../../../../../libs/db/mongoose/schemes/comment.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommentRepository } from '../../../comment/infrastructure/repositories/comment.repository';
import { PostPublicQueryRepository } from '../../infrastructure/repositories/post.query-repository';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import {
  BannedUserByBlogger,
  BannedUserByBloggerSchema,
} from '../../../../../libs/db/mongoose/schemes/banned-user-by-blogger.entity';

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
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    @InjectModel(CommentSchema.name) private CommentModel: Model<CommentSchema>,
    @InjectModel(BannedUserByBloggerSchema.name)
    private BannedUserByBloggerModel: Model<BannedUserByBloggerSchema>,
    private commentRepository: CommentRepository,
    private postsQueryRepository: PostPublicQueryRepository,
    private jwtUtils: JwtUtils,
  ) {}

  async execute({
    data: { accessToken, content, postId },
  }: CreateNewCommentCommand): Promise<CommentViewModel> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.getAccessTokenPayload(accessToken);
    const userId: string = accessTokenPayload.userId;
    const userLogin = accessTokenPayload.userLogin;
    const foundedPost: PostDocument | null =
      await this.postsQueryRepository.getRawPostById(postId);
    if (!foundedPost) throw new NotFoundException();
    await this.checkUserBannedOrNot({ userId, blogId: foundedPost.blogId });
    const newComment: Comment = foundedPost.createComment({
      userId,
      userLogin,
      content,
    });
    const newCommentModel: CommentDocument = new this.CommentModel(newComment);
    await this.commentRepository.saveComment(newCommentModel);
    const mappedComment: CommentViewModel = {
      id: newComment.id,
      content: newComment.content,
      commentatorInfo: {
        userId: String(newComment.userId),
        userLogin: newComment.userLogin,
      },
      createdAt: newComment.createdAt,
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

  async checkUserBannedOrNot({
    userId,
    blogId,
  }: {
    userId: string;
    blogId: string;
  }): Promise<void> {
    const foundedBannedUserByBlogger: BannedUserByBlogger | null =
      await this.BannedUserByBloggerModel.findOne({
        userId,
        blogId,
      });
    if (foundedBannedUserByBlogger) {
      throw new ForbiddenException();
    }
  }
}
