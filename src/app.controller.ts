import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PostSchema } from '../libs/db/mongoose/schemes/post.entity';
import { Model } from 'mongoose';
import { BlogSchema } from '../libs/db/mongoose/schemes/blog.entity';
import { UserSchema } from '../libs/db/mongoose/schemes/user.entity';
import { SessionSchema } from '../libs/db/mongoose/schemes/session.entity';
import { CommentSchema } from '../libs/db/mongoose/schemes/comment.entity';
import { LikeSchema } from '../libs/db/mongoose/schemes/like.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('testing')
export class AppController {
  constructor(
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    @InjectModel(SessionSchema.name) private SessionModel: Model<SessionSchema>,
    @InjectModel(CommentSchema.name) private CommentModel: Model<CommentSchema>,
    @InjectModel(LikeSchema.name) private LikeModel: Model<LikeSchema>,
    @InjectDataSource() private readonly dataSource: DataSource,
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
      this.dataSource.query(`
      DELETE FROM public.users_email_confirmation_info
      WHERE 1=1;
      DELETE FROM public.users_password_recovery_info
      WHERE 1=1;
      DELETE FROM public.sessions
      WHERE 1=1;
      DELETE FROM public.users
      WHERE 1=1;
      `),
    ]);
  }
}
