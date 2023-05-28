import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Comment,
  CommentDocument,
  CommentSchema,
} from '../../../../libs/db/mongoose/schemes/comment.entity';
import { Model } from 'mongoose';
import { CommentRepository } from '../comment-infrastructure/comment-repositories/comment.repository';
import { LikeService } from '../../like/like.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(CommentSchema.name) private CommentModel: Model<CommentSchema>,
    private commentRepository: CommentRepository,
    private likeService: LikeService,
  ) {}
  /*async deleteComment({
    commentId,
    userId,
  }: {
    commentId: string;
    userId: string;
  }): Promise<void> {
    const foundedComment: Comment | null = await this.CommentModel.findOne({
      id: commentId,
    });
    if (!foundedComment) {
      throw new NotFoundException();
    }
    if (foundedComment.userId !== userId) {
      throw new ForbiddenException();
    }
    this.commentRepository.deleteComment(commentId);
  }*/

  async updateComment({
    commentId,
    content,
    userId,
  }: {
    commentId: string;
    content: string;
    userId: string;
  }): Promise<void> {
    const foundedComment: CommentDocument | null =
      await this.CommentModel.findOne({
        id: commentId,
      });
    if (!foundedComment) {
      throw new NotFoundException();
    }
    if (foundedComment.userId !== userId) {
      throw new ForbiddenException();
    }
    foundedComment.content = content;
    this.commentRepository.saveComment(foundedComment);
  }

  async changeLikeStatus({
    commentId,
    reaction,
    userId,
    userLogin,
  }: {
    commentId: string;
    reaction: 'Like' | 'Dislike' | 'None';
    userId: string;
    userLogin: string;
  }): Promise<void> {
    const foundedComment: Comment | null = await this.CommentModel.findOne({
      id: commentId,
    });
    if (!foundedComment) {
      throw new NotFoundException();
    }
    this.likeService.changeEntityLikeStatus({
      likeStatus: reaction,
      userId,
      userLogin,
      entityId: commentId,
      entity: 'comment',
    });
  }
}
