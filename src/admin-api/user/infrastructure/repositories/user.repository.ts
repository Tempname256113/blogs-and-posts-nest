import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import {
  User,
  UserDocument,
  UserSchema,
} from '../../../../../libs/db/mongoose/schemes/user.entity';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
  ) {}

  async saveUser(userDocument: UserDocument): Promise<void> {
    const modifiedProperties: string[] =
      userDocument.getPossibleModifiedProperties();
    modifiedProperties.forEach((modifiedProperty) => {
      userDocument.markModified(modifiedProperty);
    });
    await userDocument.save();
  }

  async saveUser2(user: User): Promise<any> {
    const userDocument = new this.UserModel(user);
    await userDocument.save();
    // return 1
    return 'saved';
  }

  async deleteUserById(userId: string): Promise<boolean> {
    const deleteUserResult = await this.UserModel.deleteOne({ id: userId });
    return deleteUserResult.deletedCount > 0;
  }
}
