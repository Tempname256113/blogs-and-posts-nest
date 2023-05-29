import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentApiModel } from '../../../../product-module/comment/comment-api/comment-api-models/comment-api.models';
import {
  PostDocument,
  PostSchema,
} from '../../../../../libs/db/mongoose/schemes/post.entity';
import { NotFoundException } from '@nestjs/common';
import {
  Comment,
  CommentDocument,
  CommentSchema,
} from '../../../../../libs/db/mongoose/schemes/comment.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommentRepository } from '../../../../product-module/comment/comment-infrastructure/comment-repositories/comment.repository';

export class CreateNewCommentCommand {
  constructor(
    public readonly data: {
      userId: string;
      userLogin: string;
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
  ) {}

  async execute({
    data: { userId, userLogin, content, postId },
  }: CreateNewCommentCommand): Promise<CommentApiModel> {
    const foundedPost: PostDocument | null = await this.PostModel.findOne({
      id: postId,
    });
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
