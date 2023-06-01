import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export class CommentShadow {
  id: string;
  postId: string;
  userId: string;
  userLogin: string;
  content: string;
  createdAt: string;
}

class CommentMethods extends CommentShadow {}

@Schema({ versionKey: false, collection: 'comments-shadow' })
export class CommentShadowSchema
  extends CommentMethods
  implements CommentShadow
{
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

export const commentShadowSchema =
  SchemaFactory.createForClass(CommentShadowSchema);
commentShadowSchema.loadClass(CommentShadowSchema);

export type CommentDocument = HydratedDocument<CommentShadowSchema>;
