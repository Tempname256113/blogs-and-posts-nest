import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export class Comment {
  id: string;
  postId: string;
  userId: string;
  userLogin: string;
  content: string;
  createdAt: string;
}

class CommentMethods extends Comment {}

@Schema({ versionKey: false, collection: 'comments' })
export class CommentSchema extends CommentMethods implements Comment {
  @Prop()
  id: string;

  @Prop()
  postId: string;

  @Prop()
  userId: string;

  @Prop()
  userLogin: string;

  @Prop()
  content: string;

  @Prop()
  createdAt: string;
}

export const commentSchema = SchemaFactory.createForClass(CommentSchema);
commentSchema.loadClass(CommentSchema);

export type CommentDocument = HydratedDocument<CommentSchema>;
