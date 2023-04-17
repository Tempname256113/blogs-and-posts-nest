import { Module } from '@nestjs/common';
import { BlogModule } from './blog/blog.module';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';

@Module({
  imports: [BlogModule, PostModule, CommentModule],
})
export class ProductModule {}
