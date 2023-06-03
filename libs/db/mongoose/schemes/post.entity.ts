import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Comment } from './comment.entity';
import { v4 as uuidv4 } from 'uuid';

export type Post = {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  bloggerId: string;
  hidden?: boolean;
};

@Schema({ versionKey: false, collection: 'posts' })
export class PostSchema implements Post {
  @Prop()
  id: string;

  @Prop()
  title: string;

  @Prop()
  shortDescription: string;

  @Prop()
  content: string;

  @Prop()
  blogId: string;

  @Prop()
  blogName: string;

  @Prop()
  createdAt: string;

  @Prop()
  bloggerId: string;

  @Prop({ default: false })
  hidden: boolean;

  createComment({
    userId,
    userLogin,
    content,
  }: {
    userId: string;
    userLogin: string;
    content: string;
  }): Comment {
    const newComment: Comment = {
      id: uuidv4(),
      postId: this.id,
      userId,
      userLogin,
      content,
      createdAt: new Date().toISOString(),
    };
    return newComment;
  }
}

export const postSchema = SchemaFactory.createForClass(PostSchema);
postSchema.loadClass(PostSchema);

export type PostDocument = HydratedDocument<PostSchema>;
