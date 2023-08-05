import {
  BloggerRepositoryCreateBlogDTO,
  BloggerRepositoryUpdateBlogDTO,
} from './models/blogger-repository.dto';
import { BloggerRepositoryCreatedBlogType } from './models/blogger-repository.models';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BlogSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/blog-sql.entity';

@Injectable()
export class BloggerBlogRepositorySql {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(BlogSQLEntity)
    private readonly blogEntity: Repository<BlogSQLEntity>,
  ) {}

  async createBlog(
    createBlogDTO: BloggerRepositoryCreateBlogDTO,
  ): Promise<BloggerRepositoryCreatedBlogType> {
    const newBlog: BlogSQLEntity = new BlogSQLEntity();
    newBlog.bloggerId = Number(createBlogDTO.bloggerId);
    newBlog.name = createBlogDTO.name;
    newBlog.description = createBlogDTO.description;
    newBlog.websiteUrl = createBlogDTO.websiteUrl;
    newBlog.createdAt = new Date().toISOString();
    newBlog.isMembership = false;
    newBlog.isBanned = false;
    newBlog.banDate = null;
    newBlog.hidden = false;

    const newCreatedBlog: BlogSQLEntity = await this.blogEntity.save(newBlog);
    return {
      id: String(newCreatedBlog.id),
      createdAt: newCreatedBlog.createdAt,
      name: newCreatedBlog.name,
      description: newCreatedBlog.description,
      websiteUrl: newCreatedBlog.websiteUrl,
      isMembership: newCreatedBlog.isMembership,
    };
  }

  async updateBlog(
    updateBlogDTO: BloggerRepositoryUpdateBlogDTO,
  ): Promise<void> {
    await this.blogEntity.update(updateBlogDTO.blogId, {
      name: updateBlogDTO.name,
      description: updateBlogDTO.description,
      websiteUrl: updateBlogDTO.websiteUrl,
    });
  }

  async deleteBlogById(blogId: string): Promise<void> {
    await this.blogEntity.delete(blogId);
  }
}
