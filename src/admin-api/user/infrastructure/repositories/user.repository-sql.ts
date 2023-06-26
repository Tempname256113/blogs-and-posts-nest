import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { UserCreateDto } from '../../api/models/user-api.dto';
import { randomUUID } from 'crypto';
import { add } from 'date-fns';
import { hash } from 'bcrypt';

@Injectable()
export class UserRepositorySql {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async registrationNewUser(createUserDTO: UserCreateDto): Promise<string> {
    const emailConfirmationCode: string = randomUUID();
    const expirationDateEmailConfirmation: string = add(new Date(), {
      days: 3,
    }).toISOString();
    const passwordHash: string = await hash(createUserDTO.password, 10);
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const createdUser: [{ user_id: string }] = await queryRunner.query(
        `
        INSERT INTO public.users("login", "password", "email")
        VALUES($1, $2, $3)
        RETURNING "id" as "user_id";
      `,
        [createUserDTO.login, passwordHash, createUserDTO.email],
      );
      const userId: string = createdUser[0].user_id;
      await queryRunner.query(
        `
        INSERT INTO public.users_email_confirmation_info(user_id, confirmation_code, expiration_date, is_confirmed)
        VALUES($1, $2, $3, false);
      `,
        [userId, emailConfirmationCode, expirationDateEmailConfirmation],
      );
      await queryRunner.query(
        `
        INSERT INTO public.users_password_recovery_info(user_id, recovery_code, recovery_status)
        VALUES($1, null, false);
      `,
        [userId],
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.log(err);
    } finally {
      await queryRunner.release();
    }
    return emailConfirmationCode;
  }

  async confirmRegistration(confirmationEmailCode: string): Promise<void> {
    await this.dataSource.query(
      `
    UPDATE public.users_email_confirmation_info
    SET confirmation_code = null, expiration_date = null, is_confirmed = true
    WHERE confirmation_code = $1
    `,
      [confirmationEmailCode],
    );
  }

  async updateEmailConfirmationCode({
    newCode,
    email,
  }: {
    newCode: string;
    email: string;
  }): Promise<void> {
    const newExpirationDate: string = add(new Date(), {
      days: 3,
    }).toISOString();
    await this.dataSource.query(
      `
    UPDATE public.users_email_confirmation_info
    SET confirmation_code = $1, expiration_date = $2
    WHERE user_id = (select "id" from public.users u where u.email = $3)
    `,
      [newCode, newExpirationDate, email],
    );
  }
}
