import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export class User {
  id: string;
  login: string;
  password: string;
  email: string;
  createdAt: string;
}

class UserMethods extends User {}

@Schema({ versionKey: false, collection: 'users' })
export class UserSchema extends UserMethods {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  login: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  createdAt: string;
}

export const userSchema = SchemaFactory.createForClass(UserSchema);
userSchema.loadClass(UserSchema);

export type UserDocument = HydratedDocument<UserSchema>;
