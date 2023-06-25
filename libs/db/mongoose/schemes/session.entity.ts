import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { SessionUpdateRepositoryDTO } from '../../../../src/public-api/auth/infrastructure/repositories/models/auth-repository.dto';

export type Session = {
  userId: string;
  deviceId: string;
  iat: number;
  userIpAddress: string;
  userDeviceTitle: string;
  lastActiveDate: string;
};

@Schema({ versionKey: false, collection: 'sessions' })
export class SessionSchema implements Session {
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

  updateSession(updateSessionData: SessionUpdateRepositoryDTO): void {
    this.iat = updateSessionData.refreshTokenIat;
    this.userIpAddress = updateSessionData.userIpAddress;
    this.userDeviceTitle = updateSessionData.userDeviceTitle;
    this.lastActiveDate = updateSessionData.lastActiveDate;
  }
}

export const sessionSchema = SchemaFactory.createForClass(SessionSchema);
sessionSchema.loadClass(SessionSchema);

export type SessionDocument = HydratedDocument<SessionSchema>;
