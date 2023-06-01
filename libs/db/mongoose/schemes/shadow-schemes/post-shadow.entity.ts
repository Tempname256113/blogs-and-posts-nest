import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export class PostShadow {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
}

class PostMethods extends PostShadow {}

@Schema({ versionKey: false, collection: 'posts-shadow' })
export class PostShadowSchema extends PostMethods implements PostShadow {
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

export const postShadowSchema = SchemaFactory.createForClass(PostShadowSchema);
postShadowSchema.loadClass(PostShadowSchema);

export type PostDocument = HydratedDocument<PostShadowSchema>;
