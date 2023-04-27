import { Module } from '@nestjs/common';
import { CommentController } from './comment-api/comment-api-controllers/comment.controller';
import { CommentRepository } from './comment-infrastructure/comment-repositories/comment.repository';
import { CommentQueryRepository } from './comment-infrastructure/comment-repositories/comment.query-repository';
import { MongooseSchemesModule } from '../../app-configuration/db/mongoose.schemes-module';

@Module({
  imports: [MongooseSchemesModule],
  controllers: [CommentController],
  providers: [CommentRepository, CommentQueryRepository],
})
export class CommentModule {}
