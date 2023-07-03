import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BloggerRepositoryBlogType } from './models/blogger-repository.models';

@Injectable()
export class BloggerBlogQueryRepositorySQL {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getBlogByIdInternalUse(
    blogId: string,
  ): Promise<BloggerRepositoryBlogType | null> {
    if (!Number(blogId)) {
      return null;
    }
    const result: any[] = await this.dataSource.query(
      `
    SELECT *
    FROM public.blogs b
    WHERE b.id = $1
    `,
      [blogId],
    );
    if (result.length < 1) {
      return null;
    }
    const res: any = result[0];
    return {
      id: String(res.id),
      bloggerId: String(res.blogger_id),
      name: res.name,
      description: res.description,
      websiteUrl: res.website_url,
      createdAt: res.created_at,
      isMembership: res.is_membership,
      isBanned: res.is_banned,
      banDate: res.ban_date,
      hidden: res.hidden,
    };
  }
}
