import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class UserQueryRepositorySQL {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async findUserWithSimilarLoginOrEmail(data: {
    login: string;
    email: string;
  }): Promise<{ login: string; email: string } | null> {
    const result: any[] = await this.dataSource.query(
      `
      SELECT "login", "email" FROM public.users u
      WHERE u.login = $1 or u.email = $2
    `,
      [data.login, data.email],
    );
    return result.length > 0 ? result[0] : null;
  }
}
