import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PostDocument,
  PostSchema,
} from '../../post-api/post-application/post-domain/post.entity';
import { Model } from 'mongoose';

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
  ) {}
  async getPostById(postId: string): Promise<PostDocument | null> {
    return this.PostModel.findOne({ id: postId });
  }
}
