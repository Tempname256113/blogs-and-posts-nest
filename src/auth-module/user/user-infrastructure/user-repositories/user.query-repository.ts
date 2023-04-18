import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserSchema } from '../../../auth-domain/user/user.entity';
import { Model } from 'mongoose';

@Injectable()
export class UserQueryRepository {
  constructor(@InjectModel(UserSchema.name) UserModel: Model<UserSchema>) {}
}
