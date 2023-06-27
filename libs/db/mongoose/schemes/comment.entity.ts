import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type Comment = {
  id: string;
  postId: string;
  blogId: string;
  userId: number;
  userLogin: string;
  content: string;
  createdAt: string;
  hidden?: boolean;
};

@Schema({ versionKey: false, collection: 'comments' })
export class CommentSchema implements Comment {
  @Prop()
  id: string;

  @Prop()
  postId: string;

  @Prop()
  blogId: string;

  @Prop()
  userId: number;

  @Prop()
  userLogin: string;

  @Prop()
  content: string;

  @Prop()
  createdAt: string;

  @Prop({ default: false })
  hidden: boolean;
}

export const commentSchema = SchemaFactory.createForClass(CommentSchema);
commentSchema.loadClass(CommentSchema);

export type CommentDocument = HydratedDocument<CommentSchema>;
