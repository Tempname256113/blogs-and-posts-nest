import { Injectable } from '@nestjs/common';
import { IBlogApiCreateUpdateDTO } from '../blog-api/blog-api-dto/blog-api.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlogSchema, BlogDocument, Blog } from './blog-domain/blog.entity';
import { v4 as uuidv4 } from 'uuid';
import { BlogRepository } from '../blog-infrastructure/blog-repositories/blog.repository';
import { IBlogApiModel } from '../blog-api/blog-api-models/blog-api.model';

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    private blogRepository: BlogRepository,
  ) {}

  async createBlog(
    createBlogDTO: IBlogApiCreateUpdateDTO,
  ): Promise<IBlogApiModel> {
    const newBlog: Blog = {
      id: uuidv4(),
      name: createBlogDTO.name,
      description: createBlogDTO.description,
      websiteUrl: createBlogDTO.websiteUrl,
      createdAt: new Date().toISOString(),
      isMembership: true,
    };
    const newBlogModel: BlogDocument = new this.BlogModel(newBlog);
    await this.blogRepository.saveBlog(newBlogModel);
    return newBlog;
  }

  async updateBlog(
    blogId: string,
    updateBlogDTO: IBlogApiCreateUpdateDTO,
  ): Promise<boolean> {
    return this.blogRepository.updateBlog(blogId, updateBlogDTO);
  }

  async deleteBlog(blogId: string): Promise<boolean> {
    return this.blogRepository.deleteBlog(blogId);
  }
}
