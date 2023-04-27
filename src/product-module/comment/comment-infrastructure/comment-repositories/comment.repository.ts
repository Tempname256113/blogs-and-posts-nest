import { Injectable } from '@nestjs/common';
import { CommentDocument } from '../../../product-domain/comment.entity';

@Injectable()
export class CommentRepository {
  async saveComment(commentModel: CommentDocument) {
    await commentModel.save();
  }
}
