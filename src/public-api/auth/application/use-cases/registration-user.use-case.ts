import { UserApiCreateDto } from '../../../../admin-api/user/api/models/user-api.dto';
import {
  User,
  UserDocument,
  UserSchema,
} from '../../../../../libs/db/mongoose/schemes/user.entity';
import { FilterQuery, Model } from 'mongoose';
import { BadRequestException } from '@nestjs/common';
import { badRequestErrorFactoryFunction } from '../../../../../generic-factory-functions/bad-request.error-factory-function';
import { hashSync } from 'bcrypt';
import { add } from 'date-fns';
import { InjectModel } from '@nestjs/mongoose';
import { NodemailerService } from '../../../../../libs/email/nodemailer/nodemailer.service';
import { UserRepository } from '../../../../admin-api/user/infrastructure/repositories/user.repository';
import { v4 as uuidv4 } from 'uuid';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class RegistrationUserCommand {
  constructor(public readonly createNewUserDTO: UserApiCreateDto) {}
}

@CommandHandler(RegistrationUserCommand)
export class RegistrationUserUseCase
  implements ICommandHandler<RegistrationUserCommand, void>
{
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    private emailService: NodemailerService,
    private usersRepository: UserRepository,
  ) {}
  async execute({ createNewUserDTO }: RegistrationUserCommand): Promise<void> {
    await this.checkUserExistence(createNewUserDTO);
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
        expirationDate: add(new Date(), { days: 3 }).toISOString(),
        isConfirmed: false,
      },
      passwordRecovery: {
        recoveryCode: null,
        recoveryStatus: false,
      },
    };
    const newUserModel: UserDocument = new this.UserModel(newUser);
    this.emailService.sendUserConfirmation(
      createNewUserDTO.email,
      emailConfirmationCode,
    );
    await this.usersRepository.saveUser(newUserModel);
  }

  async findUserWithSimilarEmailOrLogin(
    createNewUserDTO: UserApiCreateDto,
  ): Promise<User | null> {
    const filter: FilterQuery<UserSchema> = {
      $or: [
        { 'accountData.email': createNewUserDTO.email },
        { 'accountData.login': createNewUserDTO.login },
      ],
    };
    return this.UserModel.findOne(filter).lean();
  }

  async checkUserExistence(createNewUserDTO: UserApiCreateDto): Promise<void> {
    const foundedUser: User | null = await this.findUserWithSimilarEmailOrLogin(
      createNewUserDTO,
    );
    let errorField: string | undefined;
    if (foundedUser) {
      if (foundedUser.accountData.email === createNewUserDTO.email) {
        errorField = 'email';
      }
      if (foundedUser.accountData.login === createNewUserDTO.login) {
        errorField = 'login';
      }
    }
    if (errorField) {
      throw new BadRequestException(
        badRequestErrorFactoryFunction([errorField]),
      );
    }
  }
}
