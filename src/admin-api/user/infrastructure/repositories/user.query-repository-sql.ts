import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from '../../../../../libs/db/mongoose/schemes/user.entity';

@Injectable()
export class UserQueryRepositorySQL {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async findUserWithSimilarLoginOrEmail(data: {
    login: string;
    email: string;
  }): Promise<User | null> {
    const result: any[] = await this.dataSource.query(
      `
      SELECT u."id", u."login", u."email", u."password", u."created_at", u."is_banned", u."ban_reason", u."ban_date",
      ueci."confirmation_code" as "email_confirmation_code",
      ueci."expiration_date" as "email_confirmation_expiration_date",
      ueci."is_confirmed" as "email_confirmation_status",
      upri."recovery_code" as "password_recovery_code", upri."recovery_status" as "password_recovery_status"
      FROM public.users u
      JOIN public.users_email_confirmation_info ueci on ueci.user_id = u.id
      JOIN public.users_password_recovery_info upri on upri.user_id = u.id
      WHERE u.login = $1 OR u.email = $2
    `,
      [data.login, data.email],
    );
    if (result.length > 0) {
      const rawUser: any = result[0];
      const mappedUser: User = {
        id: rawUser.id,
        accountData: {
          login: rawUser.login,
          password: rawUser.password,
          email: rawUser.email,
          createdAt: rawUser.created_at,
        },
        banInfo: {
          isBanned: rawUser.is_banned,
          banReason: rawUser.ban_reason,
          banDate: rawUser.ban_date,
        },
        emailConfirmation: {
          isConfirmed: rawUser.email_confirmation_status,
          confirmationCode: rawUser.email_confirmation_code,
          expirationDate: rawUser.email_confirmation_expiration_date,
        },
        passwordRecovery: {
          recoveryStatus: rawUser.password_recovery_status,
          recoveryCode: rawUser.password_recovery_code,
        },
      };
      return mappedUser;
    } else {
      return null;
    }
  }
}
