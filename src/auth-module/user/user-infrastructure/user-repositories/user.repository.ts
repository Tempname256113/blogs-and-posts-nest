import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import {
  UserDocument,
  UserSchema,
} from '../../../auth-domain/user/user.entity';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
  ) {}

  async createUser(userDocument: UserDocument): Promise<void> {
    await userDocument.save();
  }

  async deleteUserById(userId: string): Promise<boolean> {
    const deleteUserResult = await this.UserModel.deleteOne({ id: userId });
    return deleteUserResult.deletedCount > 0;
  }
}
