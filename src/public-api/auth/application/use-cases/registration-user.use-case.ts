import { UserCreateDto } from '../../../../admin-api/user/api/models/user-api.dto';
import { User } from '../../../../../libs/db/mongoose/schemes/user.entity';
import { BadRequestException } from '@nestjs/common';
import { exceptionFactoryFunction } from '../../../../../generic-factory-functions/exception-factory.function';
import { NodemailerService } from '../../../../../libs/email/nodemailer/nodemailer.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserQueryRepositorySQL } from '../../../../admin-api/user/infrastructure/repositories/user.query-repository-sql';
import { UserRepositorySql } from '../../../../admin-api/user/infrastructure/repositories/user.repository-sql';
import { randomUUID } from 'crypto';
import { add } from 'date-fns';

export class RegistrationUserCommand {
  constructor(public readonly createNewUserDTO: UserCreateDto) {}
}

@CommandHandler(RegistrationUserCommand)
export class RegistrationUserUseCase
  implements ICommandHandler<RegistrationUserCommand, void>
{
  constructor(
    private emailService: NodemailerService,
    private usersRepositorySQL: UserRepositorySql,
    private usersQueryRepositorySQL: UserQueryRepositorySQL,
  ) {}
  async execute({ createNewUserDTO }: RegistrationUserCommand): Promise<void> {
    const emailConfirmationCode: string = randomUUID();
    const expirationDateEmailConfirmation: string = add(new Date(), {
      days: 3,
    }).toISOString();
    await this.checkUserExistence(createNewUserDTO);
    await this.usersRepositorySQL.registrationNewUser({
      login: createNewUserDTO.login,
      password: createNewUserDTO.password,
      email: createNewUserDTO.email,
      emailConfirmationCode,
      expirationDateEmailConfirmation,
    });
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
