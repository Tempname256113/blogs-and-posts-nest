import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  UserDocument,
  UserSchema,
} from '../../../auth-module-domain/user/user.entity';
import { Model } from 'mongoose';
import {
  SessionDocument,
  SessionSchema,
} from '../../../auth-module-domain/auth/session.entity';
import { SessionUpdateDTO } from './auth-repositories-models/auth-repository.dto';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    @InjectModel(SessionSchema.name) private SessionModel: Model<SessionSchema>,
  ) {}

  async saveSession(newSession: SessionDocument): Promise<void> {
    await newSession.save();
  }

  async updateSession(
    sessionId: string,
    updateSessionData: SessionUpdateDTO,
  ): Promise<boolean> {
    const updateSession = await this.SessionModel.updateOne(
      { userId: sessionId },
      updateSessionData,
    );
    return updateSession.matchedCount > 0;
  }
}
