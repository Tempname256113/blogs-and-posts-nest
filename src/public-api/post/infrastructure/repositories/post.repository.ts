import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PostDocument,
  PostSchema,
} from '../../../../../libs/db/mongoose/schemes/post.entity';
import { PostApiCreateUpdateDTO } from '../../api/models/post-api.dto';

@Injectable()
export class PostRepository {
  constructor(
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
  ) {}
  async savePost(newPost: PostDocument): Promise<void> {
    await newPost.save();
  }

  async updatePost(
    postId: string,
    postUpdateDTO: PostApiCreateUpdateDTO,
  ): Promise<boolean> {
    const postUpdateResult = await this.PostModel.updateOne(
      { id: postId },
      postUpdateDTO,
    );
    return postUpdateResult.matchedCount > 0;
  }

  async deletePost(postId: string): Promise<boolean> {
    const postDeleteResult = await this.PostModel.deleteOne({ id: postId });
    return postDeleteResult.deletedCount > 0;
  }
}
