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
    const updateStatus = await this.BlogModel.updateOne(
      { id: blogId },
      blogUpdateDTO,
    );
    return updateStatus.matchedCount > 0;
  }
}
