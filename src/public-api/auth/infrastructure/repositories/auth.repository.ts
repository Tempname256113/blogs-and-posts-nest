import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserSchema } from '../../../../../libs/db/mongoose/schemes/user.entity';
import { Model } from 'mongoose';
import {
  SessionDocument,
  SessionSchema,
} from '../../../../../libs/db/mongoose/schemes/session.entity';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    @InjectModel(SessionSchema.name) private SessionModel: Model<SessionSchema>,
  ) {}

  async saveSession(newSession: SessionDocument): Promise<void> {
    await newSession.save();
  }

  async deleteSession(deviceId: string): Promise<boolean> {
    const deleteSessionResult = await this.SessionModel.deleteOne({ deviceId });
    return deleteSessionResult.deletedCount > 0;
  }
}
