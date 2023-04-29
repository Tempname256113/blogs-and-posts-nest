import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CommentApiModel } from '../comment-api-models/comment-api.models';
import { CommentQueryRepository } from '../../comment-infrastructure/comment-repositories/comment.query-repository';
import { AccessToken } from '../../../../app-helpers/decorators/access-token.decorator';
import { AdditionalReqDataDecorator } from '../../../../app-helpers/decorators/additional-req-data.decorator';
import { JwtAccessTokenPayloadType } from '../../../../app-models/jwt.payload.model';
import { JwtAuthGuard } from '../../../../app-helpers/passport-strategy/auth-jwt.strategy';
import { CommentService } from '../../comment-application/comment.service';

@Controller('comments')
export class CommentController {
  constructor(
    private commentQueryRepository: CommentQueryRepository,
    private commentService: CommentService,
  ) {}
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

  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @Param('commentId') commentId: string,
    @AdditionalReqDataDecorator<JwtAccessTokenPayloadType>()
    accessTokenPayload: JwtAccessTokenPayloadType,
  ): Promise<void> {
    await this.commentService.deleteComment({
      userId: accessTokenPayload.userId,
      commentId,
    });
  }
}
