import { Module } from '@nestjs/common';
import { CommentController } from './comment-api/comment-api-controllers/comment.controller';

@Module({
  controllers: [CommentController],
})
export class CommentModule {}
