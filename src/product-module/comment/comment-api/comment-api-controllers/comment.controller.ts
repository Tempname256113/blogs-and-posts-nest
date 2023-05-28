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
import { CommentApiModel } from '../comment-api-models/comment-api.models';
import { CommentQueryRepository } from '../../comment-infrastructure/comment-repositories/comment.query-repository';
import { AccessToken } from '../../../../../generic-decorators/access-token.decorator';
import { AdditionalReqDataDecorator } from '../../../../../generic-decorators/additional-req-data.decorator';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtAuthAccessTokenGuard } from '../../../../../libs/auth/passport-strategy/auth-jwt-access-token.strategy';
import { CommentService } from '../../comment-application/comment.service';
import { CommentApiUpdateDTO } from '../comment-api-models/comment-api.dto';
import { LikeDto } from '../../../product-models/like.dto';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteCommentCommand } from '../../comment-application/comment-application-use-cases/delete-comment.use-case';
import { UpdateCommentCommand } from '../../comment-application/comment-application-use-cases/update-comment.use-case';
import { ChangeLikeStatusCommand } from '../../comment-application/comment-application-use-cases/change-like-status.use-case';

@Controller('comments')
export class CommentController {
  constructor(
    private commentQueryRepository: CommentQueryRepository,
    private commentService: CommentService,
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
      new ChangeLikeStatusCommand({
        commentId,
        reaction: likeStatus,
        userLogin: accessTokenPayload.userLogin,
        userId: accessTokenPayload.userId,
      }),
    );
  }
}
