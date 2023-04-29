import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentSchema } from '../../product-domain/comment.entity';
import { Model } from 'mongoose';
import { CommentRepository } from '../comment-infrastructure/comment-repositories/comment.repository';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(CommentSchema.name) private CommentModel: Model<CommentSchema>,
    private commentRepository: CommentRepository,
  ) {}
  async deleteComment({
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
  }
}
