import { Module } from '@nestjs/common';
import { PostController } from './post-api/post-api-controllers/post.controller';
import { PostService } from './post-api/post-application/post.service';
import { PostRepository } from './post-infrastructure/post-repositories/post.repository';
import { PostQueryRepository } from './post-infrastructure/post-repositories/post.query-repository';
import { MongooseSchemesModule } from '../../../libs/db/mongoose/mongoose.schemes-module';
import { LikeModule } from '../like/like.module';
import { JwtModule } from '../../../libs/auth/jwt/jwt.module';
import { CommentModule } from '../comment/comment.module';
import { IsValidBlogIdConstraint } from '../../../libs/validation/class-validator/is-valid-blogid.validation-decorator';
import { CreateNewPostUseCase } from './post-api/post-application/post-application-use-cases/create-new-post.use-case';
import { CreateNewCommentUseCase } from './post-api/post-application/post-application-use-cases/create-new-comment.use-case';
import { UpdatePostUseCase } from './post-api/post-application/post-application-use-cases/update-post.use-case';
import { DeletePostCommand } from './post-api/post-application/post-application-use-cases/delete-post.use-case';

const UseCases = [
  CreateNewPostUseCase,
  CreateNewCommentUseCase,
  UpdatePostUseCase,
  DeletePostCommand,
];

@Module({
  imports: [MongooseSchemesModule, LikeModule, JwtModule, CommentModule],
  controllers: [PostController],
  providers: [
    PostService,
    PostRepository,
    PostQueryRepository,
    IsValidBlogIdConstraint,
    ...UseCases,
  ],
})
export class PostModule {}
