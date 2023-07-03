import { Injectable } from '@nestjs/common';
import {
  BlogSchema,
  BlogDocument,
} from '../../../../../libs/db/mongoose/schemes/blog.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlogBloggerApiCreateUpdateDTO } from '../../api/models/blog-blogger-api.dto';
import { PostDocument } from '../../../../../libs/db/mongoose/schemes/post.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BloggerRepositoryCreatedBlogType } from './models/blog-blogger-repository.models';
import { BloggerRepositoryCreateBlogDTO } from './models/blog-blogger-repository.dto';

@Injectable()
export class BlogRepository {
  constructor(
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async createBlog(
    createBlogDTO: BloggerRepositoryCreateBlogDTO,
  ): Promise<BloggerRepositoryCreatedBlogType> {
    const result: [
      { blog_id: number; created_at: string; is_membership: false },
    ] = await this.dataSource.query(
      `
    INSERT INTO public.blogs("blogger_id", "name", "description", "website_url")
    VALUES($1, $2, $3, $4)
    returning "id" as "blog_id", "created_at", "is_membership"
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

  async saveBlogOrPost(
    newBlogOrPost: BlogDocument | PostDocument,
  ): Promise<void> {
    await newBlogOrPost.save();
  }

  async updateBlog(
    blogId: string,
    blogUpdateDTO: BlogBloggerApiCreateUpdateDTO,
  ): Promise<boolean> {
    const updateBlogResult = await this.BlogModel.updateOne(
      { id: blogId },
      blogUpdateDTO,
    );
    return updateBlogResult.matchedCount > 0;
  }

  async deleteBlog(blogId: string): Promise<boolean> {
    const deleteBlogResult = await this.BlogModel.deleteOne({ id: blogId });
    return deleteBlogResult.deletedCount > 0;
  }
}
