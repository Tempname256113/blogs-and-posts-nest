import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export class Like {
  entity: 'post' | 'comment';
  entityId: string;
  userId: string;
  userLogin: string;
  likeStatus: 'Like' | 'Dislike' | 'None';
  addedAt: string;
  hidden?: boolean;
}

@Schema({ versionKey: false, collection: 'likes' })
export class LikeSchema implements Like {
  @Prop()
  entity: 'post' | 'comment';

  @Prop()
  entityId: string;

  @Prop()
  userId: string;

  @Prop()
  userLogin: string;

  @Prop()
  likeStatus: 'Like' | 'Dislike' | 'None';

  @Prop()
  addedAt: string;

  @Prop({ default: false })
  hidden: boolean;
}

export const likeSchema = SchemaFactory.createForClass(LikeSchema);
likeSchema.loadClass(LikeSchema);

export type LikeDocument = HydratedDocument<LikeSchema>;
