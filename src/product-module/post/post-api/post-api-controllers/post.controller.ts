import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { IPostApiCreateUpdateDTO } from '../post-api-dto/post-api.dto';
import { PostService } from '../post-application/post.service';
import { PostQueryRepository } from '../../post-infrastructure/post-repositories/post.query-repository';
import { PostDocument } from '../post-application/post-domain/post.entity';

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
  ): Promise<PostDocument> {
    const newPost: PostDocument | null = await this.postService.createNewPost(
      postCreateDTO,
    );
    if (!newPost) throw new NotFoundException();
    return newPost;
  }
}
