import { Injectable } from '@nestjs/common';
import {
  BlogSchema,
  BlogDocument,
} from '../../../../../libs/db/mongoose/schemes/blog.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlogBloggerApiCreateUpdateDTO } from '../../api/models/blog-blogger-api.dto';
import { PostDocument } from '../../../../../libs/db/mongoose/schemes/post.entity';

@Injectable()
export class BlogRepository {
  constructor(
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
  ) {}

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
