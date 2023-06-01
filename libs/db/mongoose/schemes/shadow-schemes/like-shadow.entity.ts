import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export class LikeShadow {
  entity: 'post' | 'comment';
  entityId: string;
  userId: string;
  userLogin: string;
  likeStatus: 'Like' | 'Dislike' | 'None';
  addedAt: string;
}

@Schema({ versionKey: false, collection: 'likes' })
export class LikeShadowSchema implements LikeShadow {
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
}

export const likeShadowSchema = SchemaFactory.createForClass(LikeShadowSchema);
likeShadowSchema.loadClass(LikeShadowSchema);

export type LikeDocument = HydratedDocument<LikeShadowSchema>;
