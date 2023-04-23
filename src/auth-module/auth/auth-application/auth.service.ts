import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  User,
  UserDocument,
  UserSchema,
} from '../../auth-module-domain/user/user.entity';
import { Model } from 'mongoose';
import { UserApiCreateDto } from '../../user/user-api/user-api-models/user-api.dto';
import { v4 as uuidv4 } from 'uuid';
import { hashSync } from 'bcrypt';
import { add } from 'date-fns';
import { AuthEmailAdapterService } from '../auth-infrastructure/auth-adapters/auth.email-adapter.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    private emailService: AuthEmailAdapterService,
  ) {}
  async registrationNewUser(createNewUserDTO: UserApiCreateDto) {
    const findUserWithSimilarEmail = async (): Promise<boolean> => {
      const foundedUser: UserDocument | null = await this.UserModel.findOne({
        'accountData.email': createNewUserDTO.email,
      });
      return !!foundedUser;
    };
    const foundedUserWithSimilarEmail: boolean =
      await findUserWithSimilarEmail();
    if (foundedUserWithSimilarEmail) {
      throw new BadRequestException({
        errorsMessages: [
          {
            message: 'invalid data',
            field: 'email',
          },
        ],
      });
    }
    const passwordHash: string = hashSync(createNewUserDTO.password, 10);
    const emailConfirmationCode: string = uuidv4();
    const newUser: User = {
      id: uuidv4(),
      accountData: {
        login: createNewUserDTO.login,
        email: createNewUserDTO.email,
        password: passwordHash,
        createdAt: new Date().toISOString(),
      },
      emailConfirmation: {
        confirmationCode: emailConfirmationCode,
        expirationDate: add(new Date(), { days: 2 }).toISOString(),
        isConfirmed: false,
      },
      passwordRecovery: {
        recoveryCode: null,
      },
    };
    const newUserModel: UserDocument = new this.UserModel(newUser);
    this.emailService.sendUserConfirmation(
      createNewUserDTO.email,
      emailConfirmationCode,
    );
  }
}
