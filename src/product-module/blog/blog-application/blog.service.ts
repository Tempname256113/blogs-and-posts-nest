import { Injectable } from '@nestjs/common';
import {
  IBlogApiCreatePostDTO,
  IBlogApiCreateUpdateDTO,
} from '../blog-api/blog-api-dto/blog-api.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BlogSchema,
  BlogDocument,
  Blog,
} from '../../product-domain/blog-domain/blog.entity';
import { v4 as uuidv4 } from 'uuid';
import { BlogRepository } from '../blog-infrastructure/blog-repositories/blog.repository';
import { IBlogApiModel } from '../blog-api/blog-api-models/blog-api.model';
import {
  PostDocument,
  PostSchema,
} from '../../product-domain/post-domain/post.entity';
import { IPostApiCreateUpdateDTO } from '../../post/post-api/post-api-dto/post-api.dto';
import { IPostApiModel } from '../../post/post-api/post-api-models/post-api.model';

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
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
    await this.blogRepository.saveBlogOrPost(newBlogModel);
    return newBlog;
  }

  async createPost(
    blogId: string,
    createPostDTO: IBlogApiCreatePostDTO,
  ): Promise<IPostApiModel | null> {
    const foundedBlog: BlogDocument | null = await this.BlogModel.findOne({
      id: blogId,
    });
    if (!foundedBlog) return null;
    const mappedCreatePostDTO: IPostApiCreateUpdateDTO = {
      title: createPostDTO.title,
      shortDescription: createPostDTO.shortDescription,
      content: createPostDTO.content,
      blogId: blogId,
    };
    const newCreatedPost: PostDocument = await foundedBlog.createPost(
      mappedCreatePostDTO,
      this.PostModel,
    );
    await this.blogRepository.saveBlogOrPost(newCreatedPost);
    const mappedNewPost: IPostApiModel = {
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
