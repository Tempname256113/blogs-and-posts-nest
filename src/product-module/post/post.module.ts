import { Module } from '@nestjs/common';
import { PostController } from './post-api/post-api-controllers/post.controller';
import { PostService } from './post-api/post-application/post.service';
import { PostRepository } from './post-infrastructure/post-repositories/post.repository';
import { PostQueryRepository } from './post-infrastructure/post-repositories/post.query-repository';
import { MongooseSchemesModule } from '../../app-configuration/db/mongoose.schemes-module';
import { LikeModule } from '../like/like.module';
import { JwtModule } from '../../app-helpers/jwt/jwt.module';
import { CommentModule } from '../comment/comment.module';

@Module({
  imports: [MongooseSchemesModule, LikeModule, JwtModule, CommentModule],
  controllers: [PostController],
  providers: [PostService, PostRepository, PostQueryRepository],
})
export class PostModule {}
