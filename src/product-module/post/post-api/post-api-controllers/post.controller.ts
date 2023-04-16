import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { IPostApiCreateUpdateDTO } from '../post-api-dto/post-api.dto';
import { PostService } from '../post-application/post.service';
import { PostQueryRepository } from '../../post-infrastructure/post-repositories/post.query-repository';
import { PostDocument } from '../post-application/post-domain/post.entity';
import { IPostApiModel } from '../post-api-models/post-api.model';
import { IPaginationQuery } from '../../../product-models/pagination.query.model';
import { PaginationQueryTransformerPipe } from '../../../product-pipes/pagination.query.transformer-pipe';
import { IPostApiPaginationModel } from '../post-api-models/post-api.pagination.model';

@Controller('posts')
export class PostController {
  constructor(
    private postService: PostService,
    private postQueryRepository: PostQueryRepository,
  ) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPost(
    @Body() postCreateDTO: IPostApiCreateUpdateDTO,
  ): Promise<IPostApiModel> {
    const newPost: PostDocument | null = await this.postService.createNewPost(
      postCreateDTO,
    );
    if (!newPost) throw new NotFoundException();
    const postApiModel: IPostApiModel = {
      id: newPost.id,
      title: newPost.title,
      shortDescription: newPost.shortDescription,
      content: newPost.content,
      blogId: newPost.blogId,
      blogName: newPost.blogName,
      createdAt: newPost.createdAt,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      },
    };
    return postApiModel;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getPostsWithPagination(
    @Query(new PaginationQueryTransformerPipe())
    paginationQuery: IPaginationQuery,
  ): Promise<IPostApiPaginationModel> {
    const postsWithPagination: IPostApiPaginationModel =
      await this.postQueryRepository.getPostsWithPagination(paginationQuery);
    return postsWithPagination;
  }

  @Get(':postId')
  @HttpCode(HttpStatus.OK)
  async getPostById(@Param('postId') postId: string): Promise<IPostApiModel> {
    const foundedPost: IPostApiModel | null =
      await this.postQueryRepository.getPostById(postId);
    if (!foundedPost) throw new NotFoundException();
    return foundedPost;
  }
}
