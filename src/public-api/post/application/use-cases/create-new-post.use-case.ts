import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostApiCreateUpdateDTO } from '../../api/models/post-api.dto';
import {
  Post,
  PostDocument,
  PostSchema,
} from '../../../../../libs/db/mongoose/schemes/post.entity';
import {
  BlogDocument,
  BlogSchema,
} from '../../../../../libs/db/mongoose/schemes/blog.entity';
import { NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PostRepository } from '../../infrastructure/repositories/post.repository';

export class CreateNewPostCommand {
  constructor(public readonly data: PostApiCreateUpdateDTO) {}
}

@CommandHandler(CreateNewPostCommand)
export class CreateNewPostUseCase
  implements ICommandHandler<CreateNewPostCommand, Post>
{
  constructor(
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    private postRepository: PostRepository,
  ) {}

  async execute({ data: createPostDTO }: CreateNewPostCommand): Promise<Post> {
    const foundedBlog: BlogDocument | null = await this.BlogModel.findOne({
      id: createPostDTO.blogId,
    });
    if (!foundedBlog) throw new NotFoundException();
    const newCreatedPost: Post = foundedBlog.createPost(createPostDTO);
    const newPostModel: PostDocument = new this.PostModel(newCreatedPost);
    await this.postRepository.savePost(newPostModel);
    return newCreatedPost;
  }
}
