import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PostDocumentType,
  PostSchema,
} from '../../../product-domain/post/post.entity';
import { IPostApiCreateUpdateDTO } from '../post-api-models/post-api.dto';
import {
  BlogDocument,
  BlogSchema,
} from '../../../product-domain/blog/blog.entity';
import { PostRepository } from '../../post-infrastructure/post-repositories/post.repository';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    private postRepository: PostRepository,
  ) {}
  async createNewPost(
    createPostDTO: IPostApiCreateUpdateDTO,
  ): Promise<PostDocumentType | null> {
    const foundedBlog: BlogDocument | null = await this.BlogModel.findOne({
      id: createPostDTO.blogId,
    });
    if (!foundedBlog) return null;
    const newCreatedPost: PostDocumentType = foundedBlog.createPost(
      createPostDTO,
      this.PostModel,
    );
    await this.postRepository.savePost(newCreatedPost);
    return newCreatedPost;
  }

  async updatePost(postId: string, postUpdateDTO): Promise<boolean> {
    return this.postRepository.updatePost(postId, postUpdateDTO);
  }

  async deletePost(postId: string): Promise<boolean> {
    return this.postRepository.deletePost(postId);
  }
}
