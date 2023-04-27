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
} from '../../auth-module/auth-module-domain/user/user.entity';
import {
  sessionSchema,
  SessionSchema,
} from '../../auth-module/auth-module-domain/auth/session.entity';
import {
  commentSchema,
  CommentSchema,
} from '../../product-module/product-domain/comment.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PostSchema.name, schema: postSchema },
      { name: BlogSchema.name, schema: blogSchema },
      { name: UserSchema.name, schema: userSchema },
      { name: SessionSchema.name, schema: sessionSchema },
      { name: CommentSchema.name, schema: commentSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class MongooseSchemesModule {}
