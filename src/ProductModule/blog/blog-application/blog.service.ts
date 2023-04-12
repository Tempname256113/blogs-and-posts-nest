import { Injectable } from '@nestjs/common';
import { BlogApiCreateUpdateDTO } from '../blog-api/dto/blog-api.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Blog, BlogDocument } from './blog-domain/blog.schema';
import { IBlogDBModel } from '../blog-infrastructure/repositories/models/blog.db-model';
import { v4 as uuidv4 } from 'uuid';
import { BlogRepository } from '../blog-infrastructure/repositories/blog.repository';
import { IBlogApiModel } from '../blog-api/models/blog-api.model';

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(Blog.name) private blogModel: Model<Blog>,
    private blogRepository: BlogRepository,
  ) {}
  getHello(): string {
    return 'Hello World!';
  }

  async createBlog(
    createBlogDTO: BlogApiCreateUpdateDTO,
  ): Promise<IBlogApiModel> {
    const newBlog: IBlogDBModel = {
      id: uuidv4(),
      name: createBlogDTO.name,
      description: createBlogDTO.description,
      websiteUrl: createBlogDTO.websiteUrl,
      createdAt: new Date().toISOString(),
      isMembership: true,
    };
    const newBlogModel: BlogDocument = new this.blogModel(newBlog);
    await this.blogRepository.saveBlog(newBlogModel);
    return newBlog;
  }
}
