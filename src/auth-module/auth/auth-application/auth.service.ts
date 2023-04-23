import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  UserDocument,
  UserSchema,
} from '../../auth-module-domain/user/user.entity';
import { Model } from 'mongoose';
import { UserApiCreateDto } from '../../user/user-api/user-api-models/user-api.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
  ) {}
  async registrationNewUser(createNewUserDTO: UserApiCreateDto) {
    const findUserWithSimilarEmail = async (): Promise<boolean> => {
      const foundedUser: UserDocument | null = await this.UserModel.findOne({
        'accountData.email': createNewUserDTO.email,
      });
      return !!foundedUser;
    };
    if (await findUserWithSimilarEmail()) {
      throw new BadRequestException({
        errorsMessages: [
          {
            message: 'invalid data',
            field: 'email',
          },
        ],
      });
    }
  }
}
