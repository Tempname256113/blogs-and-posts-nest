import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PublicCommentRepositorySql {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async createNewComment({
    postId,
    userId,
    content,
  }: {
    postId: string;
    userId: string;
    content: string;
  }): Promise<{ createdCommentId: string; commentCreatedAt: string }> {
    const result: any[] = await this.dataSource.query(
      `
    INSERT INTO public."comments"("post_id", "user_id", "content")
    VALUES($1, $2, $3)
    RETURNING "id"
    `,
      [postId, userId, content],
    );
    return {
      createdCommentId: String(result[0].id),
      commentCreatedAt: result[0].created_at,
    };
  }
}
