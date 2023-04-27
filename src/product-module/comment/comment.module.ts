import { Module } from '@nestjs/common';
import { CommentController } from './comment-api/comment-api-controllers/comment.controller';
import { CommentRepository } from './comment-infrastructure/comment-repositories/comment.repository';

@Module({
  controllers: [CommentController],
  providers: [CommentRepository],
})
export class CommentModule {}
