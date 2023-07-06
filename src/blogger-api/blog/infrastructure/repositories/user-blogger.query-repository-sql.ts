import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import {
  BloggerRepositoryBannedUserType,
  BloggerRepositoryUserType,
} from './models/blogger-repository.models';

@Injectable()
export class BloggerUserQueryRepositorySQL {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getBannedByBloggerUser({
    userId,
    blogId,
  }: {
    userId: string;
    blogId: string;
  }): Promise<BloggerRepositoryBannedUserType | null> {
    const result: any[] = await this.dataSource.query(
      `
    SELECT * 
    FROM public.banned_users_by_blogger bubb
    WHERE bubb."user_id" = $1 AND bubb."blog_id" = $2
    `,
      [userId, blogId],
    );
    if (result.length < 1) return null;
    const res: any = result[0];
    return {
      userId: String(res.user_id),
      blogId: String(res.blog_id),
      banReason: res.ban_reason,
      banDate: res.ban_date,
    };
  }

  async getUserById(userId: string): Promise<BloggerRepositoryUserType | null> {
    const result: any[] = await this.dataSource.query(
      `
    SELECT u."id", u."login", u."email", u."created_at"
    FROM public.users u
    WHERE u."id" = $1
    `,
      [userId],
    );
    if (result.length < 1) return null;
    const res: any = result[0];
    return {
      id: String(res.id),
      login: res.login,
      email: res.email,
      createdAt: res.created_at,
    };
  }
}
