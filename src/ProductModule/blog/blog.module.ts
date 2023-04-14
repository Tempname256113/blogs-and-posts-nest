import { Module } from '@nestjs/common';
import { BlogController } from './blog-api/controllers/blog.controller';
import { BlogService } from './blog-application/blog.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blog-application/blog-domain/blog.schema';
import { BlogRepository } from './blog-infrastructure/repositories/blog.repository';
import { BlogQueryRepository } from './blog-infrastructure/repositories/blog.query-repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
  ],
  controllers: [BlogController],
  providers: [BlogService, BlogRepository, BlogQueryRepository],
})
export class BlogModule {}
