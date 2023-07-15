import { Module } from '@nestjs/common';
import { CommentController } from '../../public-api/comment/api/comment.controller';
import { CommentRepository } from '../../public-api/comment/infrastructure/repositories/comment.repository';
import { CommentQueryRepository } from '../../public-api/comment/infrastructure/repositories/comment.query-repository';
import { MongooseSchemesModule } from '../../../libs/db/mongoose/mongoose.schemes-module';
import { LikeModule } from './like.module';
import { JwtModule } from '../../../libs/auth/jwt/jwt.module';
import { DeleteCommentUseCase } from '../../public-api/comment/application/use-cases/delete-comment.use-case';
import { UpdateCommentUseCase } from '../../public-api/comment/application/use-cases/update-comment.use-case';
import { ChangeCommentLikeStatusUseCase } from '../../public-api/comment/application/use-cases/change-comment-like-status-use.case';
import { CqrsModule } from '@nestjs/cqrs';
import { AccessTokenGuard } from '../../../generic-guards/access-token.guard';
import { UserQueryRepositorySQL } from '../../admin-api/user/infrastructure/repositories/user.query-repository-sql';
import { PublicCommentRepositorySQL } from '../../public-api/comment/infrastructure/repositories/comment-public.repository-sql';
import { PublicCommentQueryRepositorySQL } from '../../public-api/comment/infrastructure/repositories/comment-public.query-repository-sql';

const UseCases = [
  DeleteCommentUseCase,
  UpdateCommentUseCase,
  ChangeCommentLikeStatusUseCase,
];

@Module({
  imports: [MongooseSchemesModule, LikeModule, JwtModule, CqrsModule],
  controllers: [CommentController],
  providers: [
    CommentRepository,
    CommentQueryRepository,
    PublicCommentRepositorySQL,
    PublicCommentQueryRepositorySQL,
    ...UseCases,
    UserQueryRepositorySQL,
    AccessTokenGuard,
  ],
  exports: [CommentRepository, CommentQueryRepository],
})
export class CommentModule {}
