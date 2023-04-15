import { Module } from '@nestjs/common';
import { BlogModule } from './blog/blog.module';
import { PostModule } from './post/post.module';

@Module({
  imports: [BlogModule, PostModule],
})
export class ProductModule {}
