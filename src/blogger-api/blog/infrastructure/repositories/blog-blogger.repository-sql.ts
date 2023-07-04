import {
  BloggerRepositoryCreateBlogDTO,
  BloggerRepositoryUpdateBlogDTO,
} from './models/blogger-repository.dto';
import { BloggerRepositoryCreatedBlogType } from './models/blogger-repository.models';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BloggerBlogRepositorySql {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async createBlog(
    createBlogDTO: BloggerRepositoryCreateBlogDTO,
  ): Promise<BloggerRepositoryCreatedBlogType> {
    const result: [
      { blog_id: number; created_at: string; is_membership: false },
    ] = await this.dataSource.query(
      `
    INSERT INTO public.blogs("blogger_id", "name", "description", "website_url")
    VALUES($1, $2, $3, $4)
    RETURNING "id" as "blog_id", "created_at", "is_membership"
    `,
      [
        createBlogDTO.bloggerId,
        createBlogDTO.name,
        createBlogDTO.description,
        createBlogDTO.websiteUrl,
      ],
    );
    return {
      id: String(result[0].blog_id),
      createdAt: result[0].created_at,
      name: createBlogDTO.name,
      description: createBlogDTO.description,
      websiteUrl: createBlogDTO.websiteUrl,
      isMembership: result[0].is_membership,
    };
  }

  async updateBlog(
    updateBlogDTO: BloggerRepositoryUpdateBlogDTO,
  ): Promise<void> {
    await this.dataSource.query(
      `
    UPDATE public.blogs
    SET "name" = $1, "description" = $2, "website_url" = $3
    WHERE "id" = $4
    `,
      [
        updateBlogDTO.name,
        updateBlogDTO.description,
        updateBlogDTO.websiteUrl,
        updateBlogDTO.blogId,
      ],
    );
  }

  async deleteBlogById(blogId: string): Promise<void> {
    await this.dataSource.query(
      `
    DELETE FROM public.blogs
    WHERE "id" = $1
    `,
      [blogId],
    );
  }
}
