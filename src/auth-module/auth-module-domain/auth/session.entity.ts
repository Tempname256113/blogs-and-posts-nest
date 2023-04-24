import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export class Session {
  userId: string;
  iat: number;
}

@Schema({ versionKey: false, collection: 'sessions' })
export class SessionSchema implements Session {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  iat: number;
}

export const sessionSchema = SchemaFactory.createForClass(SessionSchema);
sessionSchema.loadClass(SessionSchema);

export type SessionDocument = HydratedDocument<SessionSchema>;
