import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  postSchema,
  PostSchema,
} from '../../product-module/product-domain/post/post.entity';
import {
  blogSchema,
  BlogSchema,
} from '../../product-module/product-domain/blog/blog.entity';
import {
  userSchema,
  UserSchema,
} from '../../auth-module/auth-module-domain/user/user.entity';
import {
  sessionSchema,
  SessionSchema,
} from '../../auth-module/auth-module-domain/auth/session.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PostSchema.name, schema: postSchema },
      { name: BlogSchema.name, schema: blogSchema },
      { name: UserSchema.name, schema: userSchema },
      { name: SessionSchema.name, schema: sessionSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class MongooseSchemesModule {}
