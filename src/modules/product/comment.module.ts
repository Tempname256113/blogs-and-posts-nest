import { Module } from '@nestjs/common';
import { CommentController } from '../../public-api/comment/api/comment.controller';
import { CommentRepository } from '../../public-api/comment/infrastructure/repositories/comment.repository';
import { CommentQueryRepository } from '../../public-api/comment/infrastructure/repositories/comment.query-repository';
import { MongooseSchemesModule } from '../../../libs/db/mongoose/mongoose.schemes-module';
import { LikeModule } from '../../product-module/like/like.module';
import { JwtModule } from '../../../libs/auth/jwt/jwt.module';
import { DeleteCommentUseCase } from '../../public-api/comment/application/use-cases/delete-comment.use-case';
import { UpdateCommentUseCase } from '../../public-api/comment/application/use-cases/update-comment.use-case';
import { ChangeCommentLikeStatusUseCase } from '../../public-api/comment/application/use-cases/change-comment-like-status-use.case';
import { CqrsModule } from '@nestjs/cqrs';

const UseCases = [
  DeleteCommentUseCase,
  UpdateCommentUseCase,
  ChangeCommentLikeStatusUseCase,
];

@Module({
  imports: [MongooseSchemesModule, LikeModule, JwtModule, CqrsModule],
  controllers: [CommentController],
  providers: [CommentRepository, CommentQueryRepository, ...UseCases],
  exports: [CommentRepository, CommentQueryRepository],
})
export class CommentModule {}
