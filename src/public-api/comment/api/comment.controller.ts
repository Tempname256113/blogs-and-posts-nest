import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CommentViewModel } from './models/comment-api.models';
import { CommentQueryRepository } from '../infrastructure/repositories/comment.query-repository';
import { AccessToken } from '../../../../generic-decorators/access-token.decorator';
import { CommentApiUpdateDTO } from './models/comment-api.dto';
import { LikeDto } from '../../like/api/models/like.dto';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteCommentCommand } from '../application/use-cases/delete-comment.use-case';
import { UpdateCommentCommand } from '../application/use-cases/update-comment.use-case';
import { ChangeCommentLikeStatusCommand } from '../application/use-cases/change-comment-like-status-use.case';
import { AccessTokenGuard } from '../../../../generic-guards/access-token.guard';
import { PublicCommentQueryRepositorySQL } from '../infrastructure/repositories/comment-public.query-repository-sql';

@Controller('comments')
export class CommentController {
  constructor(
    private readonly commentQueryRepositorySQL: PublicCommentQueryRepositorySQL,
    private commentQueryRepository: CommentQueryRepository,
    private commandBus: CommandBus,
  ) {}
  @Get(':commentId')
  @HttpCode(HttpStatus.OK)
  async getCommentById(
    @Param('commentId') commentId: string,
    @AccessToken() accessToken: string | null,
  ): Promise<CommentViewModel> {
    const foundedComment: CommentViewModel | null =
      await this.commentQueryRepositorySQL.getCommentById({
        commentId,
        accessToken,
      });
    if (!foundedComment) throw new NotFoundException();
    return foundedComment;
  }

  @Delete(':commentId')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Param('commentId') commentId: string,
    @AccessToken() accessToken: string | null,
  ): Promise<void> {
    await this.commandBus.execute<DeleteCommentCommand, void>(
      new DeleteCommentCommand({
        accessToken,
        commentId,
      }),
    );
  }

  @Put(':commentId')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateComment(
    @Body() commentUpdateDTO: CommentApiUpdateDTO,
    @Param('commentId') commentId: string,
    @AccessToken() accessToken: string | null,
  ): Promise<void> {
    if (!accessToken) throw new UnauthorizedException();
    await this.commandBus.execute<UpdateCommentCommand, void>(
      new UpdateCommentCommand({
        accessToken,
        commentId,
        content: commentUpdateDTO.content,
      }),
    );
  }

  @Put(':commentId/like-status')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeLikeStatus(
    @Param('commentId') commentId: string,
    @Body() { likeStatus }: LikeDto,
    @AccessToken() accessToken: string | null,
  ): Promise<void> {
    await this.commandBus.execute<ChangeCommentLikeStatusCommand, void>(
      new ChangeCommentLikeStatusCommand({
        commentId,
        reaction: likeStatus,
        accessToken,
      }),
    );
  }
}
