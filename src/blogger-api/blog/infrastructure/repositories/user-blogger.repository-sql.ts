import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class BloggerUserRepositorySQL {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async banUser(banUserDTO: {
    userId: string;
    blogId: string;
    banReason: string;
  }): Promise<void> {
    await this.dataSource.query(
      `
    INSERT INTO public.banned_users_by_blogger("user_id", "blog_id", "ban_reason")
    VALUES($1, $2, $3)
    `,
      [banUserDTO.userId, banUserDTO.blogId, banUserDTO.banReason],
    );
  }

  async unbanUser(unbanUserDTO: {
    userId: string;
    blogId: string;
  }): Promise<void> {
    await this.dataSource.query(
      `
    DELETE FROM public.banned_users_by_blogger
    WHERE "user_id" = $1 AND "blog_id" = $2
    `,
      [unbanUserDTO.userId, unbanUserDTO.blogId],
    );
  }
}
