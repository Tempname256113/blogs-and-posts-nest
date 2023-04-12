import { Module } from '@nestjs/common';
import { BlogController } from './blog-api/controllers/blog.controller';
import { BlogService } from './blog-application/blog.service';

@Module({
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule {}
