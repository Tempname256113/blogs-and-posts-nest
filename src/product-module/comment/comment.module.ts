import { Module } from '@nestjs/common';
import { CommentController } from './comment-api/comment-api-controllers/comment.controller';
import { CommentRepository } from './comment-infrastructure/comment-repositories/comment.repository';
import { CommentQueryRepository } from './comment-infrastructure/comment-repositories/comment.query-repository';
import { MongooseSchemesModule } from '../../../libs/db/mongoose/mongoose.schemes-module';
import { LikeModule } from '../like/like.module';
import { JwtModule } from '../../../libs/auth/jwt/jwt.module';
import { CommentService } from './comment-application/comment.service';
import { DeleteCommentUseCase } from './comment-application/comment-application-use-cases/delete-comment.use-case';
import { UpdateCommentUseCase } from './comment-application/comment-application-use-cases/update-comment.use-case';
import { ChangeLikeStatusUseCase } from './comment-application/comment-application-use-cases/change-like-status.use-case';
import { CqrsModule } from '@nestjs/cqrs';

const UseCases = [
  DeleteCommentUseCase,
  UpdateCommentUseCase,
  ChangeLikeStatusUseCase,
];

@Module({
  imports: [MongooseSchemesModule, LikeModule, JwtModule, CqrsModule],
  controllers: [CommentController],
  providers: [
    CommentRepository,
    CommentQueryRepository,
    CommentService,
    ...UseCases,
  ],
  exports: [CommentRepository, CommentQueryRepository],
})
export class CommentModule {}
