import { Module } from '@nestjs/common';
import { CommentController } from './comment-api/comment-api-controllers/comment.controller';
import { CommentRepository } from './comment-infrastructure/comment-repositories/comment.repository';
import { CommentQueryRepository } from './comment-infrastructure/comment-repositories/comment.query-repository';
import { MongooseSchemesModule } from '../../../libs/db/mongoose/mongoose.schemes-module';
import { LikeModule } from '../like/like.module';
import { JwtModule } from '../../../libs/auth/jwt/jwt.module';
import { CommentService } from './comment-application/comment.service';

@Module({
  imports: [MongooseSchemesModule, LikeModule, JwtModule],
  controllers: [CommentController],
  providers: [CommentRepository, CommentQueryRepository, CommentService],
  exports: [CommentRepository, CommentQueryRepository],
})
export class CommentModule {}
