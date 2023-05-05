import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Comment } from './comment.entity';
import { v4 as uuidv4 } from 'uuid';

export class Post {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
}

class PostMethods extends Post {
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

@Schema({ versionKey: false, collection: 'posts' })
export class PostSchema extends PostMethods implements Post {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  shortDescription: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  blogId: string;

  @Prop({ required: true })
  blogName: string;

  @Prop({ required: true })
  createdAt: string;
}

export const postSchema = SchemaFactory.createForClass(PostSchema);
postSchema.loadClass(PostSchema);

export type PostDocument = HydratedDocument<PostSchema>;
