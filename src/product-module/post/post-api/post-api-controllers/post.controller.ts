import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { IPostApiCreateUpdateDTO } from '../post-api-models/post-api.dto';
import { PostService } from '../post-application/post.service';
import { PostQueryRepository } from '../../post-infrastructure/post-repositories/post.query-repository';
import { PostDocument } from '../../../product-domain/post/post.entity';
import {
  IPostApiModel,
  IPostApiPaginationModel,
} from '../post-api-models/post-api.models';
import { IPostApiPaginationQueryDTO } from '../post-api-models/post-api.query-dto';

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
    @Query()
    rawPaginationQuery: IPostApiPaginationQueryDTO,
  ): Promise<IPostApiPaginationModel> {
    const paginationQuery: IPostApiPaginationQueryDTO = {
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
    const postsWithPagination: IPostApiPaginationModel =
      await this.postQueryRepository.getPostsWithPagination(paginationQuery);
    return postsWithPagination;
  }

  @Get(':postId/comments')
  @HttpCode(HttpStatus.OK)
  async getCommentsWithPaginationByPostId(
    @Param('postId') postId: string,
    @Query()
    rawPaginationQuery: IPostApiPaginationQueryDTO,
  ) {
    const foundedPost: IPostApiModel | null =
      await this.postQueryRepository.getPostById(postId);
    if (!foundedPost) throw new NotFoundException();
    return {
      pagesCount: 1,
      page: Number(rawPaginationQuery.pageNumber),
      pageSize: Number(rawPaginationQuery.pageSize),
      totalCount: 0,
      items: [],
    };
  }

  @Get(':postId')
  @HttpCode(HttpStatus.OK)
  async getPostById(@Param('postId') postId: string): Promise<IPostApiModel> {
    const foundedPost: IPostApiModel | null =
      await this.postQueryRepository.getPostById(postId);
    if (!foundedPost) throw new NotFoundException();
    return foundedPost;
  }

  @Put(':postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('postId') postId: string,
    @Body() postUpdateDTO: IPostApiCreateUpdateDTO,
  ): Promise<void> {
    const postUpdateStatus: boolean = await this.postService.updatePost(
      postId,
      postUpdateDTO,
    );
    if (!postUpdateStatus) throw new NotFoundException();
  }

  @Delete(':postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('postId') postId: string): Promise<void> {
    const postDeleteStatus: boolean = await this.postService.deletePost(postId);
    if (!postDeleteStatus) throw new NotFoundException();
  }
}
