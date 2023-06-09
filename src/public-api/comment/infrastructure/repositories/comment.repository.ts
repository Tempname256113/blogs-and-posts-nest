import { Injectable } from '@nestjs/common';
import {
  CommentDocument,
  CommentSchema,
} from '../../../../../libs/db/mongoose/schemes/comment.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectModel(CommentSchema.name) private CommentModel: Model<CommentSchema>,
  ) {}
  async saveComment(commentModel: CommentDocument) {
    await commentModel.save();
  }

  async deleteComment(commentId: string): Promise<boolean> {
    const deleteCommentResult = await this.CommentModel.deleteOne({
      id: commentId,
      hidden: false,
    });
    return deleteCommentResult.deletedCount > 0;
  }
}
