import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogApiCreateUpdateDTO } from '../blog-api/blog-api-models/blog-api.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BlogSchema,
  BlogDocument,
  Blog,
} from '../../../../libs/db/mongoose/schemes/blog.entity';
import { v4 as uuidv4 } from 'uuid';
import { BlogRepository } from '../blog-infrastructure/blog-repositories/blog.repository';
import { BlogApiModelType } from '../blog-api/blog-api-models/blog-api.models';
import {
  Post,
  PostDocument,
  PostSchema,
} from '../../../../libs/db/mongoose/schemes/post.entity';
import { PostApiCreateUpdateDTO } from '../../post/post-api/post-api-models/post-api.dto';
import { PostApiModel } from '../../post/post-api/post-api-models/post-api.models';

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    private blogRepository: BlogRepository,
  ) {}

  /*async createBlog(
    createBlogDTO: BlogApiCreateUpdateDTO,
  ): Promise<BlogApiModelType> {
    const newBlog: Blog = {
      id: uuidv4(),
      name: createBlogDTO.name,
      description: createBlogDTO.description,
      websiteUrl: createBlogDTO.websiteUrl,
      createdAt: new Date().toISOString(),
      isMembership: false,
    };
    const newBlogModel: BlogDocument = new this.BlogModel(newBlog);
    await this.blogRepository.saveBlogOrPost(newBlogModel);
    return newBlog;
  }*/

  /*async createPost(
    blogId: string,
    createPostDTO: PostApiCreateUpdateDTO,
  ): Promise<PostApiModel> {
    const foundedBlog: BlogDocument | null = await this.BlogModel.findOne({
      id: blogId,
    });
    if (!foundedBlog) throw new NotFoundException();
    const newCreatedPost: Post = await foundedBlog.createPost(createPostDTO);
    const newPostModel: PostDocument = new this.PostModel(newCreatedPost);
    await this.blogRepository.saveBlogOrPost(newPostModel);
    const mappedNewPost: PostApiModel = {
      id: newCreatedPost.id,
      title: newCreatedPost.title,
      shortDescription: newCreatedPost.shortDescription,
      content: newCreatedPost.content,
      blogId: newCreatedPost.blogId,
      blogName: newCreatedPost.blogName,
      createdAt: newCreatedPost.createdAt,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      },
    };
    return mappedNewPost;
  }*/

  async updateBlog(
    blogId: string,
    updateBlogDTO: BlogApiCreateUpdateDTO,
  ): Promise<void> {
    const blogUpdateStatus: boolean = await this.blogRepository.updateBlog(
      blogId,
      updateBlogDTO,
    );
    if (!blogUpdateStatus) throw new NotFoundException();
  }

  async deleteBlog(blogId: string): Promise<void> {
    const deleteBlogStatus: boolean = await this.blogRepository.deleteBlog(
      blogId,
    );
    if (!deleteBlogStatus) throw new NotFoundException();
  }
}
