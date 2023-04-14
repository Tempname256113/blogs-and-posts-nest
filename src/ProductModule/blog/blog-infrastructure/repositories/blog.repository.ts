import { Injectable } from '@nestjs/common';
import {
  Blog,
  BlogDocument,
} from '../../blog-application/blog-domain/blog.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IBlogApiCreateUpdateDTO } from '../../blog-api/dto/blog-api.dto';

@Injectable()
export class BlogRepository {
  constructor(@InjectModel(Blog.name) private BlogModel: Model<Blog>) {}

  async saveBlog(newBlog: BlogDocument): Promise<void> {
    await newBlog.save();
  }

  async updateBlog(
    blogId: string,
    blogUpdateDTO: IBlogApiCreateUpdateDTO,
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
