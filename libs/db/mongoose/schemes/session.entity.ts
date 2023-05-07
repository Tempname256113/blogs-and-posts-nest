import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { SessionUpdateDTO } from '../../../../src/auth-module/auth/auth-infrastructure/auth-repositories/auth-repositories-models/auth-repository.dto';

export class Session {
  userId: string;
  deviceId: string;
  iat: number;
  userIpAddress: string;
  userDeviceTitle: string;
  lastActiveDate: string;
}

class SessionMethods extends Session {
  updateSession(updateSessionData: SessionUpdateDTO): void {
    this.iat = updateSessionData.refreshTokenIat;
    this.userIpAddress = updateSessionData.userIpAddress;
    this.userDeviceTitle = updateSessionData.userDeviceTitle;
    this.lastActiveDate = updateSessionData.lastActiveDate;
  }
}

@Schema({ versionKey: false, collection: 'sessions' })
export class SessionSchema extends SessionMethods implements Session {
  @Prop()
  userId: string;

  @Prop()
  deviceId: string;

  @Prop()
  iat: number;

  @Prop()
  userIpAddress: string;

  @Prop()
  userDeviceTitle: string;

  @Prop()
  lastActiveDate: string;
}

export const sessionSchema = SchemaFactory.createForClass(SessionSchema);
sessionSchema.loadClass(SessionSchema);

export type SessionDocument = HydratedDocument<SessionSchema>;
