import { Module } from '@nestjs/common';
import { PostController } from './post-api/post-api-controllers/post.controller';
import { PostService } from './post-api/post-application/post.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PostRepository } from './post-infrastructure/post-repositories/post.repository';
import { PostSchema, postSchema } from '../product-domain/post/post.entity';
import { blogSchema, BlogSchema } from '../product-domain/blog/blog.entity';
import { PostQueryRepository } from './post-infrastructure/post-repositories/post.query-repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PostSchema.name, schema: postSchema },
      { name: BlogSchema.name, schema: blogSchema },
    ]),
  ],
  controllers: [PostController],
  providers: [PostService, PostRepository, PostQueryRepository],
})
export class PostModule {}