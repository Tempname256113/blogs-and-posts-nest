import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserSchema } from '../../../../../libs/db/mongoose/schemes/user.entity';
import { Model } from 'mongoose';
import {
  SessionDocument,
  SessionSchema,
} from '../../../../../libs/db/mongoose/schemes/session.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    @InjectModel(SessionSchema.name) private SessionModel: Model<SessionSchema>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async saveSession(newSession: SessionDocument): Promise<void> {
    await newSession.save();
  }

  async deleteSession(deviceId: string): Promise<boolean> {
    const deleteSessionResult = await this.SessionModel.deleteOne({ deviceId });
    return deleteSessionResult.deletedCount > 0;
  }

  async createNewSession({
    userId,
    deviceId,
    refreshTokenIat,
    userIpAddress,
    userDeviceTitle,
  }: {
    userId: string;
    refreshTokenIat: number;
    deviceId: string;
    userIpAddress: string;
    userDeviceTitle: string;
  }): Promise<void> {
    await this.dataSource.query(
      `
    INSERT INTO public.sessions("user_id", "device_id", "iat", "user_ip_address", "user_device_title")
    VALUES($1, $2, $3, $4, $5)
    `,
      [userId, deviceId, refreshTokenIat, userIpAddress, userDeviceTitle],
    );
  }
}
