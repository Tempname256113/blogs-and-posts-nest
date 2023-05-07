import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  SessionDocument,
  SessionSchema,
} from '../../../../libs/db/mongoose/schemes/session.entity';
import { Model } from 'mongoose';
import { SessionUpdateDTO } from '../../auth/auth-infrastructure/auth-repositories/auth-repositories-models/auth-repository.dto';

@Injectable()
export class SecurityService {
  constructor(
    @InjectModel(SessionSchema.name) private SessionModel: Model<SessionSchema>,
  ) {}
  // const updateSession = async (): Promise<boolean> => {
  //   const foundedSession: SessionDocument | null =
  //     await this.SessionModel.findOne({
  //       deviceId: user.id,
  //     });
  //   if (!foundedSession) {
  //     return false;
  //   } else {
  //     const sessionUpdateData: SessionUpdateDTO = {
  //       refreshTokenIat: newRefreshToken.iat,
  //       userIpAddress: clientIpAddress,
  //       userDeviceTitle: clientDeviceTitle,
  //       lastActiveDate: newRefreshToken.activeDate,
  //     };
  //     foundedSession.updateSession(sessionUpdateData);
  //     return true;
  //   }
  // };
}
