import { Module } from '@nestjs/common';
import { PostController } from './api/post.controller';
import { PostRepository } from './infrastructure/repositories/post.repository';
import { PostQueryRepository } from './infrastructure/repositories/post.query-repository';
import { MongooseSchemesModule } from '../../../libs/db/mongoose/mongoose.schemes-module';
import { LikeModule } from '../../product-module/like/like.module';
import { JwtModule } from '../../../libs/auth/jwt/jwt.module';
import { CommentModule } from '../../product-module/comment/comment.module';
import { IsValidBlogIdConstraint } from '../../../libs/validation/class-validator/is-valid-blogid.validation-decorator';
import { CreateNewPostUseCase } from './application/use-cases/create-new-post.use-case';
import { CreateNewCommentUseCase } from './application/use-cases/create-new-comment.use-case';
import { UpdatePostUseCase } from './application/use-cases/update-post.use-case';
import { DeletePostUseCase } from './application/use-cases/delete-post.use-case';
import { ChangePostLikeStatusUseCase } from './application/use-cases/change-post-like-status.use-case';
import { CqrsModule } from '@nestjs/cqrs';

const UseCases = [
  CreateNewPostUseCase,
  CreateNewCommentUseCase,
  UpdatePostUseCase,
  DeletePostUseCase,
  ChangePostLikeStatusUseCase,
];

@Module({
  imports: [
    MongooseSchemesModule,
    LikeModule,
    JwtModule,
    CommentModule,
    CqrsModule,
  ],
  controllers: [PostController],
  providers: [
    PostRepository,
    PostQueryRepository,
    IsValidBlogIdConstraint,
    ...UseCases,
  ],
})
export class PostModule {}
