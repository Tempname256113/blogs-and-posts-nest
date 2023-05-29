import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommentApiModel } from './models/comment-api.models';
import { CommentQueryRepository } from '../infrastructure/repositories/comment.query-repository';
import { AccessToken } from '../../../../generic-decorators/access-token.decorator';
import { AdditionalReqDataDecorator } from '../../../../generic-decorators/additional-req-data.decorator';
import { JwtAccessTokenPayloadType } from '../../../../generic-models/jwt.payload.model';
import { JwtAuthAccessTokenGuard } from '../../../../libs/auth/passport-strategy/auth-jwt-access-token.strategy';
import { CommentApiUpdateDTO } from './models/comment-api.dto';
import { LikeDto } from '../../../product-module/product-models/like.dto';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteCommentCommand } from '../application/use-cases/delete-comment.use-case';
import { UpdateCommentCommand } from '../application/use-cases/update-comment.use-case';
import { ChangeCommentLikeStatusCommand } from '../application/use-cases/change-comment-like-status-use.case';

@Controller('comments')
export class CommentController {
  constructor(
    private commentQueryRepository: CommentQueryRepository,
    private commandBus: CommandBus,
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
  @UseGuards(JwtAuthAccessTokenGuard)
  async deleteComment(
    @Param('commentId') commentId: string,
    @AdditionalReqDataDecorator<JwtAccessTokenPayloadType>()
    accessTokenPayload: JwtAccessTokenPayloadType,
  ): Promise<void> {
    await this.commandBus.execute<DeleteCommentCommand, void>(
      new DeleteCommentCommand({
        userId: accessTokenPayload.userId,
        commentId,
      }),
    );
  }

  @Put(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthAccessTokenGuard)
  async updateComment(
    @Body() commentUpdateDTO: CommentApiUpdateDTO,
    @Param('commentId') commentId: string,
    @AdditionalReqDataDecorator<JwtAccessTokenPayloadType>()
    accessTokenPayload: JwtAccessTokenPayloadType,
  ): Promise<void> {
    await this.commandBus.execute<UpdateCommentCommand, void>(
      new UpdateCommentCommand({
        userId: accessTokenPayload.userId,
        commentId,
        content: commentUpdateDTO.content,
      }),
    );
  }

  @Put(':commentId/like-status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthAccessTokenGuard)
  async changeLikeStatus(
    @Param('commentId') commentId: string,
    @Body() { likeStatus }: LikeDto,
    @AdditionalReqDataDecorator<JwtAccessTokenPayloadType>()
    accessTokenPayload: JwtAccessTokenPayloadType,
  ): Promise<void> {
    await this.commandBus.execute(
      new ChangeCommentLikeStatusCommand({
        commentId,
        reaction: likeStatus,
        userLogin: accessTokenPayload.userLogin,
        userId: accessTokenPayload.userId,
      }),
    );
  }
}
