import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentApiModel } from '../../../comment/api/models/comment-api.models';
import {
  PostDocument,
  PostSchema,
} from '../../../../../libs/db/mongoose/schemes/post.entity';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
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
import { JwtHelpers } from '../../../../../libs/auth/jwt/jwt-helpers.service';

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
  implements ICommandHandler<CreateNewCommentCommand, CommentApiModel>
{
  constructor(
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    @InjectModel(CommentSchema.name) private CommentModel: Model<CommentSchema>,
    private commentRepository: CommentRepository,
    private postsQueryRepository: PostPublicQueryRepository,
    private jwtHelpers: JwtHelpers,
  ) {}

  async execute({
    data: { accessToken, content, postId },
  }: CreateNewCommentCommand): Promise<CommentApiModel> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtHelpers.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const userId = accessTokenPayload.userId;
    const userLogin = accessTokenPayload.userLogin;
    const foundedPost: PostDocument | null =
      await this.postsQueryRepository.getRawPostById(postId);
    if (!foundedPost) throw new NotFoundException();
    const newComment: Comment = foundedPost.createComment({
      userId,
      userLogin,
      content,
    });
    const newCommentModel: CommentDocument = new this.CommentModel(newComment);
    await this.commentRepository.saveComment(newCommentModel);
    const mappedComment: CommentApiModel = {
      id: newComment.id,
      content: newComment.content,
      commentatorInfo: {
        userId: newComment.userId,
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
}
