import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserSchema } from '../../../auth-module-domain/user/user.entity';
import { Model } from 'mongoose';

@Injectable()
export class AuthRepository {
  constructor(@InjectModel(UserSchema.name) UserModel: Model<UserSchema>) {}
}
