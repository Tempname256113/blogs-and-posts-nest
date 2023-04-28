import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { CommentApiModel } from '../comment-api-models/comment-api.models';
import { CommentQueryRepository } from '../../comment-infrastructure/comment-repositories/comment.query-repository';
import { AccessToken } from '../../../../app-helpers/decorators/access-token.decorator';

@Controller('comments')
export class CommentController {
  constructor(private commentQueryRepository: CommentQueryRepository) {}
  @Get(':commentId')
  @HttpCode(HttpStatus.OK)
  async getCommentById(
    @Param('commentId') commentId: string,
    @AccessToken() accessToken: string | null,
  ): Promise<CommentApiModel> {
    const foundedComment: CommentApiModel =
      await this.commentQueryRepository.getCommentById({
        commentId,
        accessToken,
      });
    return foundedComment;
  }
}
