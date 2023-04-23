import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PostSchema } from './product-module/product-domain/post/post.entity';
import { Model } from 'mongoose';
import { BlogSchema } from './product-module/product-domain/blog/blog.entity';
import { UserSchema } from './auth-module/auth-module-domain/user/user.entity';

@Controller('testing')
export class AppController {
  constructor(
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
  ) {}
  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllData() {
    await Promise.all([
      this.PostModel.deleteMany(),
      this.BlogModel.deleteMany(),
      this.UserModel.deleteMany(),
    ]);
  }
}
