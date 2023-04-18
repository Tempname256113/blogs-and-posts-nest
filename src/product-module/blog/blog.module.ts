import { Module } from '@nestjs/common';
import { BlogController } from './blog-api/blog-api-controllers/blog.controller';
import { BlogService } from './blog-application/blog.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogSchema, blogSchema } from '../product-domain/blog/blog.entity';
import { BlogRepository } from './blog-infrastructure/blog-repositories/blog.repository';
import { BlogQueryRepository } from './blog-infrastructure/blog-repositories/blog.query-repository';
import { postSchema, PostSchema } from '../product-domain/post/post.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BlogSchema.name, schema: blogSchema },
      { name: PostSchema.name, schema: postSchema },
    ]),
  ],
  controllers: [BlogController],
  providers: [BlogService, BlogRepository, BlogQueryRepository],
})
export class BlogModule {}
