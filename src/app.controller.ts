import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PostSchema } from './product-module/product-domain/post.entity';
import { Model } from 'mongoose';
import { BlogSchema } from './product-module/product-domain/blog.entity';
import { UserSchema } from './auth-module/auth-domain/user.entity';
import { SessionSchema } from './auth-module/auth-domain/session.entity';
import { CommentSchema } from './product-module/product-domain/comment.entity';
import { LikeSchema } from './product-module/product-domain/like.entity';

@Controller('testing')
export class AppController {
  constructor(
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    @InjectModel(SessionSchema.name) private SessionModel: Model<SessionSchema>,
    @InjectModel(CommentSchema.name) private CommentModel: Model<CommentSchema>,
    @InjectModel(LikeSchema.name) private LikeModel: Model<LikeSchema>,
  ) {}
  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllData() {
    await Promise.all([
      this.PostModel.deleteMany(),
      this.BlogModel.deleteMany(),
      this.UserModel.deleteMany(),
      this.SessionModel.deleteMany(),
      this.CommentModel.deleteMany(),
      this.LikeModel.deleteMany(),
    ]);
  }
}
