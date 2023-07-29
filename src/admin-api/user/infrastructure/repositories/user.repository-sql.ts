import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  QueryBuilder,
  QueryRunner,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { add } from 'date-fns';
import { UserSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/users/user-sql.entity';
import { UserEmailConfirmInfoSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/users/user-email-confirm-info-sql.entity';
import { UserPasswordRecoveryInfoSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/users/user-password-recovery-info-sql.entity';

@Injectable()
export class UserRepositorySQL {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(UserSQLEntity)
    private readonly userEntity: Repository<UserSQLEntity>,
    @InjectRepository(UserEmailConfirmInfoSQLEntity)
    private readonly userEmailConfirmInfoEntity: Repository<UserEmailConfirmInfoSQLEntity>,
    @InjectRepository(UserPasswordRecoveryInfoSQLEntity)
    private readonly userPasswordRecoveryInfoEntity: Repository<UserPasswordRecoveryInfoSQLEntity>,
  ) {}

  async registrationNewUser(createUserDTO: {
    login: string;
    password: string;
    email: string;
    emailConfirmationCode: string;
    emailConfirmExpirationDate: string;
  }): Promise<void> {
    const createNewUser = (): UserSQLEntity => {
      const newCreatedUser: UserSQLEntity = new UserSQLEntity();
      newCreatedUser.login = createUserDTO.login;
      newCreatedUser.password = createUserDTO.password;
      newCreatedUser.email = createUserDTO.password;
      newCreatedUser.createdAt = new Date().toISOString();
      newCreatedUser.isBanned = false;
      newCreatedUser.banReason = null;
      newCreatedUser.banDate = null;
      return newCreatedUser;
    };
    const newCreatedUser: UserSQLEntity = createNewUser();

    const createUserEmailConfirmationInfo =
      (): UserEmailConfirmInfoSQLEntity => {
        const userEmailConfirmationInfo: UserEmailConfirmInfoSQLEntity =
          new UserEmailConfirmInfoSQLEntity();
        userEmailConfirmationInfo.confirmationCode =
          createUserDTO.emailConfirmationCode;
        userEmailConfirmationInfo.expirationDate =
          createUserDTO.emailConfirmExpirationDate;
        userEmailConfirmationInfo.isConfirmed = false;
        userEmailConfirmationInfo.user = newCreatedUser;
        return userEmailConfirmationInfo;
      };
    const userEmailConfirmationInfo: UserEmailConfirmInfoSQLEntity =
      createUserEmailConfirmationInfo();

    const createUserPasswordRecoveryInfo =
      (): UserPasswordRecoveryInfoSQLEntity => {
        const userPasswordRecoveryInfo: UserPasswordRecoveryInfoSQLEntity =
          new UserPasswordRecoveryInfoSQLEntity();
        userPasswordRecoveryInfo.recoveryCode = null;
        userPasswordRecoveryInfo.recoveryStatus = false;
        userPasswordRecoveryInfo.user = newCreatedUser;
        return userPasswordRecoveryInfo;
      };
    const userPasswordRecoveryInfo: UserPasswordRecoveryInfoSQLEntity =
      createUserPasswordRecoveryInfo();

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await this.userEntity.save(newCreatedUser);
      await this.userEmailConfirmInfoEntity.save(userEmailConfirmationInfo);
      await this.userPasswordRecoveryInfoEntity.save(userPasswordRecoveryInfo);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.log(err);
    } finally {
      await queryRunner.release();
    }
  }

  async confirmUserRegistration(confirmationEmailCode: string): Promise<void> {
    await this.userEmailConfirmInfoEntity.update(
      { confirmationCode: confirmationEmailCode },
      { confirmationCode: null, expirationDate: null, isConfirmed: true },
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
    const queryBuilder: SelectQueryBuilder<UserPasswordRecoveryInfoSQLEntity> =
      await this.dataSource.createQueryBuilder();
    await queryBuilder
      .update(UserPasswordRecoveryInfoSQLEntity)
      .set({ recoveryCode: passwordRecoveryCode, recoveryStatus: true })
      .where(
        'public.user_password_recovery_info."userId" = ' +
          queryBuilder
            .subQuery()
            .select('u.id')
            .from(UserSQLEntity, 'u')
            .where('u.email = :email')
            .getQuery(),
      )
      .setParameter('email', email)
      .execute();
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
      await this.userPasswordRecoveryInfoEntity.update(userId, {
        recoveryCode: null,
        recoveryStatus: false,
      });
      await this.userEntity.update(userId, { password: newPassword });
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
          [createUserDTO.login, createUserDTO.password, createUserDTO.email],
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
    if (!Number(userId)) {
      return false;
    }
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
