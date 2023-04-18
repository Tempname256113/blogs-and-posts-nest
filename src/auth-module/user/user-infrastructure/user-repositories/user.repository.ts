import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserDocument } from '../../../auth-domain/user/user.entity';

@Injectable()
export class UserRepository {
  async createUser(userDocument: UserDocument): Promise<void> {
    await userDocument.save();
  }
}
