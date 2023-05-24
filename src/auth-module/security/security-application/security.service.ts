import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Session,
  SessionSchema,
} from '../../../../libs/db/mongoose/schemes/session.entity';
import { FilterQuery, Model } from 'mongoose';
import { JwtRefreshTokenPayloadType } from '../../../../generic-models/jwt.payload.model';

@Injectable()
export class SecurityService {
  constructor(
    @InjectModel(SessionSchema.name) private SessionModel: Model<SessionSchema>,
  ) {}
  /*async deleteAllSessionsExcludeCurrent(
    reqRefreshTokenPayload: JwtRefreshTokenPayloadType,
  ): Promise<void> {
    const allFoundedSessions: Session[] = await this.SessionModel.find({
      userId: reqRefreshTokenPayload.userId,
    }).lean();
    const deviceIdForDeleteArray: string[] = [];
    for (const sessionFromDB of allFoundedSessions) {
      if (sessionFromDB.deviceId !== reqRefreshTokenPayload.deviceId) {
        deviceIdForDeleteArray.push(sessionFromDB.deviceId);
      }
    }
    const filter: FilterQuery<SessionSchema> = {
      deviceId: { $in: deviceIdForDeleteArray },
    };
    await this.SessionModel.deleteMany(filter);
  }*/

  async deleteSessionByDeviceId(reqData: {
    deviceId: string;
    refreshTokenPayload: JwtRefreshTokenPayloadType;
  }): Promise<void> {
    const foundedSessionByDeviceId: Session | null =
      await this.SessionModel.findOne({
        deviceId: reqData.deviceId,
      }).lean();
    if (!foundedSessionByDeviceId) {
      throw new NotFoundException();
    }
    if (
      foundedSessionByDeviceId.userId !== reqData.refreshTokenPayload.userId
    ) {
      throw new ForbiddenException();
    }
    await this.SessionModel.deleteOne({ deviceId: reqData.deviceId });
  }
}
