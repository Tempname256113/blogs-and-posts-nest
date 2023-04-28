import { Module } from '@nestjs/common';
import { PostController } from './post-api/post-api-controllers/post.controller';
import { PostService } from './post-api/post-application/post.service';
import { PostRepository } from './post-infrastructure/post-repositories/post.repository';
import { PostQueryRepository } from './post-infrastructure/post-repositories/post.query-repository';
import { MongooseSchemesModule } from '../../app-configuration/db/mongoose.schemes-module';
import { CommentRepository } from '../comment/comment-infrastructure/comment-repositories/comment.repository';
import { CommentQueryRepository } from '../comment/comment-infrastructure/comment-repositories/comment.query-repository';
import { LikeModule } from '../like/like.module';
import { JwtHelpers } from '../../app-helpers/jwt/jwt.helpers';
import { EnvConfiguration } from '../../app-configuration/environment/env-configuration';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [MongooseSchemesModule, LikeModule],
  controllers: [PostController],
  providers: [
    PostService,
    PostRepository,
    PostQueryRepository,
    CommentRepository,
    CommentQueryRepository,
    EnvConfiguration,
    JwtService,
    JwtHelpers,
  ],
})
export class PostModule {}
