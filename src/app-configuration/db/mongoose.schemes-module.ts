import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  postSchema,
  PostSchema,
} from '../../product-module/product-domain/post.entity';
import {
  blogSchema,
  BlogSchema,
} from '../../product-module/product-domain/blog.entity';
import {
  userSchema,
  UserSchema,
} from '../../auth-module/auth-domain/user.entity';
import {
  sessionSchema,
  SessionSchema,
} from '../../auth-module/auth-domain/session.entity';
import {
  commentSchema,
  CommentSchema,
} from '../../product-module/product-domain/comment.entity';
import {
  likeSchema,
  LikeSchema,
} from '../../product-module/product-domain/like.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PostSchema.name, schema: postSchema },
      { name: BlogSchema.name, schema: blogSchema },
      { name: UserSchema.name, schema: userSchema },
      { name: SessionSchema.name, schema: sessionSchema },
      { name: CommentSchema.name, schema: commentSchema },
      { name: LikeSchema.name, schema: likeSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class MongooseSchemesModule {}
