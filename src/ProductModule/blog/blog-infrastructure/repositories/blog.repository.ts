import { Injectable } from '@nestjs/common';
import { BlogDocument } from '../../blog-application/blog-domain/blog.schema';

@Injectable()
export class BlogRepository {
  async saveBlog(newBlog: BlogDocument): Promise<void> {
    await newBlog.save();
  }
}
