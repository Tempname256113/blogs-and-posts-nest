import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BloggerRepositoryCreatedPostType } from './models/blogger-repository.models';
import {
  BloggerRepositoryCreatePostDTO,
  BloggerRepositoryUpdatePostDTO,
} from './models/blogger-repository.dto';

@Injectable()
export class BloggerPostRepositorySQL {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async createPost(
    createPostDTO: BloggerRepositoryCreatePostDTO,
  ): Promise<BloggerRepositoryCreatedPostType> {
    const result: [{ post_id: number; created_at: string }] =
      await this.dataSource.query(
        `
    INSERT INTO public.posts("blog_id", "title", "short_description", "content")
    VALUES($1, $2, $3, $4)
    RETURNING "id" as "post_id", "created_at"
    `,
        [
          createPostDTO.blogId,
          createPostDTO.title,
          createPostDTO.shortDescription,
          createPostDTO.content,
        ],
      );
    return {
      id: String(result[0].post_id),
      blogId: String(createPostDTO.blogId),
      title: createPostDTO.title,
      shortDescription: createPostDTO.shortDescription,
      content: createPostDTO.content,
      createdAt: result[0].created_at,
    };
  }

  async updatePostById(
    postUpdateDTO: BloggerRepositoryUpdatePostDTO,
  ): Promise<void> {
    await this.dataSource.query(
      `
    UPDATE public.posts
    SET "title" = $1, "short_description" = $2, "content" = $3
    WHERE "id" = $4
    `,
      [
        postUpdateDTO.title,
        postUpdateDTO.shortDescription,
        postUpdateDTO.content,
        postUpdateDTO.postId,
      ],
    );
  }
}
