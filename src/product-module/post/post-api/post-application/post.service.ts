import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Post,
  PostDocument,
  PostSchema,
} from '../../../product-domain/post.entity';
import { IPostApiCreateUpdateDTO } from '../post-api-models/post-api.dto';
import { BlogDocument, BlogSchema } from '../../../product-domain/blog.entity';
import { PostRepository } from '../../post-infrastructure/post-repositories/post.repository';
import {
  Comment,
  CommentDocument,
  CommentSchema,
} from '../../../product-domain/comment.entity';
import { CommentRepository } from '../../../comment/comment-infrastructure/comment-repositories/comment.repository';
import { CommentApiModel } from '../../../comment/comment-api/comment-api-models/comment-api.models';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    @InjectModel(CommentSchema.name) private CommentModel: Model<CommentSchema>,
    private postRepository: PostRepository,
    private commentRepository: CommentRepository,
  ) {}
  async createNewPost(createPostDTO: IPostApiCreateUpdateDTO): Promise<Post> {
    const foundedBlog: BlogDocument | null = await this.BlogModel.findOne({
      id: createPostDTO.blogId,
    });
    if (!foundedBlog) throw new NotFoundException();
    const newCreatedPost: Post = foundedBlog.createPost(createPostDTO);
    const newPostModel: PostDocument = new this.PostModel(newCreatedPost);
    this.postRepository.savePost(newPostModel);
    return newCreatedPost;
  }

  async createNewComment({
    userId,
    userLogin,
    content,
    postId,
  }: {
    userId: string;
    userLogin: string;
    content: string;
    postId: string;
  }): Promise<CommentApiModel> {
    const foundedPost: PostDocument | null = await this.PostModel.findOne({
      id: postId,
    });
    if (!foundedPost) throw new NotFoundException();
    const newComment: Comment = foundedPost.createComment({
      userId,
      userLogin,
      content,
    });
    const newCommentModel: CommentDocument = new this.CommentModel(newComment);
    this.commentRepository.saveComment(newCommentModel);
    const mappedComment: CommentApiModel = {
      id: newComment.id,
      content: newComment.content,
      commentatorInfo: {
        userId: newComment.userId,
        userLogin: newComment.userLogin,
      },
      createdAt: newComment.createdAt,
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
      },
    };
    return mappedComment;
  }

  async updatePost(
    postId: string,
    postUpdateDTO: IPostApiCreateUpdateDTO,
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
