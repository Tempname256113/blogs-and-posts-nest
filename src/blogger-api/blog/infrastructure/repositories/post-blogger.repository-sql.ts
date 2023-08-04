import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BloggerRepositoryCreatedPostType } from './models/blogger-repository.models';
import {
  BloggerRepositoryCreatePostDTO,
  BloggerRepositoryUpdatePostDTO,
} from './models/blogger-repository.dto';
import { PostSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/post-sql.entity';

@Injectable()
export class BloggerPostRepositorySQL {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(PostSQLEntity)
    private readonly postEntity: Repository<PostSQLEntity>,
  ) {}

  async createPost(
    createPostDTO: BloggerRepositoryCreatePostDTO,
  ): Promise<BloggerRepositoryCreatedPostType> {
    const newPost: PostSQLEntity = new PostSQLEntity();
    newPost.blogId = Number(createPostDTO.blogId);
    newPost.title = createPostDTO.title;
    newPost.shortDescription = createPostDTO.shortDescription;
    newPost.content = createPostDTO.content;
    newPost.createdAt = new Date().toISOString();
    newPost.hidden = false;

    const newCreatedPost: PostSQLEntity = await this.postEntity.save(newPost);
    return {
      id: String(newCreatedPost.id),
      blogId: String(newCreatedPost.blogId),
      title: newCreatedPost.title,
      shortDescription: newCreatedPost.shortDescription,
      content: newCreatedPost.content,
      createdAt: newCreatedPost.createdAt,
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

  async deletePostById(postId: string): Promise<void> {
    await this.dataSource.query(
      `
    DELETE FROM public.posts
    WHERE "id" = $1
    `,
      [postId],
    );
  }
}
