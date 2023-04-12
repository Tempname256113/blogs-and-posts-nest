import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { BlogService } from '../../blog-application/blog.service';
import { envVariables } from '../../../../config/app.env-variables';

@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  createBlog() {}

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
