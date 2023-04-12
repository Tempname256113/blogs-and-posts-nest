import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { BlogService } from '../../blog-application/blog.service';
import { envVariables } from '../../../../config/app.env-variables';
import { BlogApiCreateUpdateDTO } from '../dto/blog-api.dto';
import { IBlogApiModel } from '../models/blog-api.model';

@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBlog(
    @Body() blogCreateUpdateDTO: BlogApiCreateUpdateDTO,
  ): Promise<IBlogApiModel> {
    return await this.blogService.createBlog(blogCreateUpdateDTO);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  getHello(): string {
    return this.blogService.getHello();
  }

  @Get('config')
  getConfig(): string {
    return envVariables.MONGO_LOCAL;
  }
}
