import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { postSchema, PostSchema } from './schemes/post.entity';
import { blogSchema, BlogSchema } from './schemes/blog.entity';
import { userSchema, UserSchema } from './schemes/user.entity';
import { sessionSchema, SessionSchema } from './schemes/session.entity';
import { commentSchema, CommentSchema } from './schemes/comment.entity';
import { likeSchema, LikeSchema } from './schemes/like.entity';
import {
  bannedUserByBloggerSchema,
  BannedUserByBloggerSchema,
} from './schemes/banned-user-by-blogger.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PostSchema.name, schema: postSchema },
      { name: BlogSchema.name, schema: blogSchema },
      { name: UserSchema.name, schema: userSchema },
      { name: SessionSchema.name, schema: sessionSchema },
      { name: CommentSchema.name, schema: commentSchema },
      { name: LikeSchema.name, schema: likeSchema },
      {
        name: BannedUserByBloggerSchema.name,
        schema: bannedUserByBloggerSchema,
      },
    ]),
  ],
  exports: [MongooseModule],
})
export class MongooseSchemesModule {}
