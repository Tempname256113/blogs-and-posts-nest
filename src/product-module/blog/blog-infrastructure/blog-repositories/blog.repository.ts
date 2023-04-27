import { Injectable } from '@nestjs/common';
import { BlogSchema, BlogDocument } from '../../../product-domain/blog.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IBlogApiCreateUpdateDTO } from '../../blog-api/blog-api-models/blog-api.dto';
import { PostDocument } from '../../../product-domain/post.entity';

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
