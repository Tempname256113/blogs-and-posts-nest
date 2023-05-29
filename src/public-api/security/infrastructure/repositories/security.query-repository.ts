import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Session,
  SessionSchema,
} from '../../../../../libs/db/mongoose/schemes/session.entity';
import { Model } from 'mongoose';
import { SessionSecurityApiModel } from '../../api/models/security-api.models';
import { JwtRefreshTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';

@Injectable()
export class SecurityQueryRepository {
  constructor(
    @InjectModel(SessionSchema.name) private SessionModel: Model<SessionSchema>,
  ) {}
  async getAllActiveSessions(
    refreshTokenPayload: JwtRefreshTokenPayloadType,
  ): Promise<SessionSecurityApiModel[]> {
    const foundedSessions: Session[] = await this.SessionModel.find({
      userId: refreshTokenPayload.userId,
    }).lean();
    const mappedSessionArray: SessionSecurityApiModel[] = [];
    for (const rawSession of foundedSessions) {
      const mappedSession: SessionSecurityApiModel = {
        ip: rawSession.userIpAddress,
        deviceId: rawSession.deviceId,
        title: rawSession.userDeviceTitle,
        lastActiveDate: rawSession.lastActiveDate,
      };
      mappedSessionArray.push(mappedSession);
    }
    return mappedSessionArray;
  }
}
