import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { SessionUpdateDTO } from '../../auth/auth-infrastructure/auth-repositories/auth-repositories-models/auth-repository.dto';

export class Session {
  userId: string;
  iat: number;
}

class SessionMethods extends Session {
  updateSession(updateSessionData: SessionUpdateDTO) {
    this.iat = updateSessionData.refreshTokenIat;
  }
}

@Schema({ versionKey: false, collection: 'sessions' })
export class SessionSchema extends SessionMethods implements Session {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  iat: number;
}

export const sessionSchema = SchemaFactory.createForClass(SessionSchema);
sessionSchema.loadClass(SessionSchema);

export type SessionDocument = HydratedDocument<SessionSchema>;
