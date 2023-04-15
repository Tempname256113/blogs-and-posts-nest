import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PostDocument,
  PostSchema,
} from '../../post-api/post-application/post-domain/post.entity';

@Injectable()
export class PostRepository {
  constructor(
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
  ) {}
  async savePost(newPost: PostDocument): Promise<void> {
    await newPost.save();
  }
}
