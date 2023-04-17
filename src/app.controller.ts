import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PostSchema } from './product-module/post/post-api/post-application/post-domain/post.entity';
import { Model } from 'mongoose';
import { BlogSchema } from './product-module/blog/blog-application/blog-domain/blog.entity';

@Controller('testing')
export class AppController {
  constructor(
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
  ) {}
  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllData() {
    await Promise.all([
      this.PostModel.deleteMany(),
      this.BlogModel.deleteMany(),
    ]);
  }
}
