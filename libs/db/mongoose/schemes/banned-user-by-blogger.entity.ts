import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BannedUserByBlogger = {
  userId: string;
  userLogin: string;
  blogId: string;
  banReason: string;
  banDate: string;
};

@Schema({ versionKey: false, collection: 'banned-users-by-bloggers' })
export class BannedUserByBloggerSchema implements BannedUserByBlogger {
  @Prop()
  userId: string;

  @Prop()
  userLogin: string;

  @Prop()
  blogId: string;

  @Prop()
  banReason: string;

  @Prop()
  banDate: string;
}

export const bannedUserByBloggerSchema = SchemaFactory.createForClass(
  BannedUserByBloggerSchema,
);
bannedUserByBloggerSchema.loadClass(BannedUserByBloggerSchema);

export type BannedUserByBloggerDocument =
  HydratedDocument<BannedUserByBloggerSchema>;
