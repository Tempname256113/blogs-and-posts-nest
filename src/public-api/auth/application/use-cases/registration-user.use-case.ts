import { UserCreateDto } from '../../../../admin-api/user/api/models/user-api.dto';
import {
  User,
  UserSchema,
} from '../../../../../libs/db/mongoose/schemes/user.entity';
import { Model } from 'mongoose';
import { BadRequestException } from '@nestjs/common';
import { exceptionFactoryFunction } from '../../../../../generic-factory-functions/exception-factory.function';
import { InjectModel } from '@nestjs/mongoose';
import { NodemailerService } from '../../../../../libs/email/nodemailer/nodemailer.service';
import { UserRepository } from '../../../../admin-api/user/infrastructure/repositories/user.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserQueryRepositorySQL } from '../../../../admin-api/user/infrastructure/repositories/user.query-repository-sql';
import { UserRepositorySql } from '../../../../admin-api/user/infrastructure/repositories/user.repository-sql';

export class RegistrationUserCommand {
  constructor(public readonly createNewUserDTO: UserCreateDto) {}
}

@CommandHandler(RegistrationUserCommand)
export class RegistrationUserUseCase
  implements ICommandHandler<RegistrationUserCommand, void>
{
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    private emailService: NodemailerService,
    private usersRepository: UserRepository,
    private usersRepositorySQL: UserRepositorySql,
    private usersQueryRepositorySQL: UserQueryRepositorySQL,
  ) {}
  async execute({ createNewUserDTO }: RegistrationUserCommand): Promise<void> {
    await this.checkUserExistence(createNewUserDTO);
    const emailConfirmationCode: string =
      await this.usersRepositorySQL.registrationNewUser(createNewUserDTO);
    this.emailService.sendUserConfirmation(
      createNewUserDTO.email,
      emailConfirmationCode,
    );
  }

  async checkUserExistence(createNewUserDTO: UserCreateDto): Promise<void> {
    const foundedUser: User | null =
      await this.usersQueryRepositorySQL.findUserWithSimilarLoginOrEmail(
        createNewUserDTO,
      );
    const errorField: string[] = [];
    if (foundedUser) {
      if (foundedUser.accountData.email === createNewUserDTO.email) {
        errorField.push('email');
      }
      if (foundedUser.accountData.login === createNewUserDTO.login) {
        errorField.push('login');
      }
    }
    if (errorField.length > 0) {
      throw new BadRequestException(exceptionFactoryFunction([...errorField]));
    }
  }
}
