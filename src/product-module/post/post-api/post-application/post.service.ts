import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PostDocumentType,
  PostSchema,
} from '../../../product-domain/post/post.entity';
import { PostApiCreateUpdateDTOType } from '../post-api-models/post-api.dto';
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
    createPostDTO: PostApiCreateUpdateDTOType,
  ): Promise<PostDocumentType> {
    const foundedBlog: BlogDocument | null = await this.BlogModel.findOne({
      id: createPostDTO.blogId,
    });
    if (!foundedBlog) throw new NotFoundException();
    const newCreatedPost: PostDocumentType = foundedBlog.createPost(
      createPostDTO,
      this.PostModel,
    );
    await this.postRepository.savePost(newCreatedPost);
    return newCreatedPost;
  }

  async updatePost(
    postId: string,
    postUpdateDTO: PostApiCreateUpdateDTOType,
  ): Promise<void> {
    const postUpdateStatus: boolean = await this.postRepository.updatePost(
      postId,
      postUpdateDTO,
    );
    if (!postUpdateStatus) throw new NotFoundException();
  }

  async deletePost(postId: string): Promise<void> {
    const postDeleteStatus: boolean = await this.postRepository.deletePost(
      postId,
    );
    if (!postDeleteStatus) throw new NotFoundException();
  }
}
