import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { add } from 'date-fns';
import { hash } from 'bcrypt';

@Injectable()
export class UserRepositorySql {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async registrationNewUser(createUserDTO: {
    login: string;
    password: string;
    email: string;
    emailConfirmationCode: string;
    expirationDateEmailConfirmation: string;
  }): Promise<void> {
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
        [
          userId,
          createUserDTO.emailConfirmationCode,
          createUserDTO.expirationDateEmailConfirmation,
        ],
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
  }

  async confirmUserRegistration(confirmationEmailCode: string): Promise<void> {
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

  async setPasswordRecoveryCode({
    email,
    passwordRecoveryCode,
  }: {
    email: string;
    passwordRecoveryCode: string;
  }): Promise<void> {
    await this.dataSource.query(
      `
    UPDATE public.users_password_recovery_info
    SET recovery_code = $1, recovery_status = true
    WHERE user_id = (select "id" from public.users u where u.email = $2)
    `,
      [passwordRecoveryCode, email],
    );
  }

  async setUserNewPassword({
    newPassword,
    userId,
  }: {
    newPassword: string;
    userId: number;
  }): Promise<void> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(
        `
      UPDATE public.users_password_recovery_info
      SET "recovery_code" = null, "recovery_status" = false
      WHERE "user_id" = $1
      `,
        [userId],
      );
      await queryRunner.query(
        `
      UPDATE public.users
      SET "password" = $1
      WHERE "id" = $2
      `,
        [newPassword, userId],
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.log(err);
    } finally {
      await queryRunner.release();
    }
  }

  async banUnbanUserById(banUserDTO: {
    userId: number;
    banReason?: string;
    isBanned: boolean;
  }): Promise<void> {
    if (banUserDTO.isBanned) {
      await this.dataSource.query(
        `
    UPDATE public.users u
    SET "is_banned" = true, "ban_reason" = $1, ban_date = now()
    WHERE "id" = $2
    `,
        [banUserDTO.banReason, banUserDTO.userId],
      );
    } else {
      await this.dataSource.query(
        `
    UPDATE public.users u
    SET "is_banned" = false, "ban_reason" = null, ban_date = null
    WHERE "id" = $1
    `,
        [banUserDTO.userId],
      );
    }
  }

  async createNewUser(createUserDTO: {
    login: string;
    password: string;
    email: string;
  }): Promise<{ userId: number; createdAt: string }> {
    const passwordHash: string = await hash(createUserDTO.password, 10);
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const createdUser: [{ user_id: number; created_at: string }] =
        await queryRunner.query(
          `
        INSERT INTO public.users("login", "password", "email")
        VALUES($1, $2, $3)
        RETURNING "id" as "user_id", "created_at"
      `,
          [createUserDTO.login, passwordHash, createUserDTO.email],
        );
      const userId: number = createdUser[0].user_id;
      const userCreatedAt: string = createdUser[0].created_at;
      await queryRunner.query(
        `
        INSERT INTO public.users_email_confirmation_info(user_id, confirmation_code, expiration_date, is_confirmed)
        VALUES($1, null, null, true);
      `,
        [userId],
      );
      await queryRunner.query(
        `
        INSERT INTO public.users_password_recovery_info(user_id, recovery_code, recovery_status)
        VALUES($1, null, false);
      `,
        [userId],
      );
      await queryRunner.commitTransaction();
      return {
        userId,
        createdAt: userCreatedAt,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.log(err);
    } finally {
      await queryRunner.release();
    }
  }

  async deleteUserById(userId: number): Promise<boolean> {
    const result: any[] = await this.dataSource.query(
      `
    DELETE FROM public.users
    WHERE "id" = $1
    RETURNING "id"
    `,
      [userId],
    );
    return result.length >= 1;
  }
}
