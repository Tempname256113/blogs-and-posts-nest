import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('comments')
export class CommentController {
  @Get(':commentId')
  @HttpCode(HttpStatus.NOT_FOUND)
  async getCommentById(): Promise<void> {
    console.log('route in process');
  }
}
