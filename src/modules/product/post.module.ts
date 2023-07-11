import { Module } from '@nestjs/common';
import { PostController } from '../../public-api/post/api/post.controller';
import { PostRepository } from '../../public-api/post/infrastructure/repositories/post.repository';
import { PostPublicQueryRepository } from '../../public-api/post/infrastructure/repositories/post.query-repository';
import { MongooseSchemesModule } from '../../../libs/db/mongoose/mongoose.schemes-module';
import { LikeModule } from './like.module';
import { JwtModule } from '../../../libs/auth/jwt/jwt.module';
import { CommentModule } from './comment.module';
import { IsValidBlogIdConstraint } from '../../../libs/validation/class-validator/is-valid-blogid.validation-decorator';
import { CreateNewPostUseCase } from '../../public-api/post/application/use-cases/create-new-post.use-case';
import { CreateNewCommentUseCase } from '../../public-api/post/application/use-cases/create-new-comment.use-case';
import { UpdatePostUseCase } from '../../public-api/post/application/use-cases/update-post.use-case';
import { DeletePostUseCase } from '../../public-api/post/application/use-cases/delete-post.use-case';
import { ChangePostLikeStatusUseCase } from '../../public-api/post/application/use-cases/change-post-like-status.use-case';
import { CqrsModule } from '@nestjs/cqrs';
import { PublicBlogQueryRepository } from '../../public-api/blog/infrastructure/repositories/blog-public.query-repository';
import { PublicPostQueryRepositorySQL } from '../../public-api/post/infrastructure/repositories/post-public.query-repository-sql';
import { PublicBlogQueryRepositorySQL } from '../../public-api/blog/infrastructure/repositories/blog-public.query-repository-sql';

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
    PublicPostQueryRepositorySQL,
    PublicBlogQueryRepositorySQL,
    PostPublicQueryRepository,
    PublicBlogQueryRepository,
    IsValidBlogIdConstraint,
    ...UseCases,
  ],
})
export class PostModule {}
