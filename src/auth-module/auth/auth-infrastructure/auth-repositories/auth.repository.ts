import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserSchema } from '../../../auth-domain/user.entity';
import { Model } from 'mongoose';
import {
  SessionDocument,
  SessionSchema,
} from '../../../auth-domain/session.entity';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    @InjectModel(SessionSchema.name) private SessionModel: Model<SessionSchema>,
  ) {}

  async saveSession(newSession: SessionDocument): Promise<void> {
    await newSession.save();
  }

  async deleteSession(userId: string): Promise<boolean> {
    const deleteSessionResult = await this.SessionModel.deleteOne({ userId });
    return deleteSessionResult.deletedCount > 0;
  }
}
