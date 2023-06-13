import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Comment,
  CommentSchema,
} from '../../../../../libs/db/mongoose/schemes/comment.entity';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChangeEntityLikeStatusCommand } from '../../../like/application/use-cases/change-entity-like-status.use-case';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';

export class ChangeCommentLikeStatusCommand {
  constructor(
    public readonly data: {
      commentId: string;
      reaction: 'Like' | 'Dislike' | 'None';
      accessToken: string;
    },
  ) {}
}

@CommandHandler(ChangeCommentLikeStatusCommand)
export class ChangeCommentLikeStatusUseCase
  implements ICommandHandler<ChangeCommentLikeStatusCommand, void>
{
  constructor(
    @InjectModel(CommentSchema.name) private CommentModel: Model<CommentSchema>,
    private commandBus: CommandBus,
    private jwtHelpers: JwtUtils,
  ) {}

  async execute({
    data: { commentId, reaction, accessToken },
  }: ChangeCommentLikeStatusCommand): Promise<void> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtHelpers.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const userId = accessTokenPayload.userId;
    const userLogin = accessTokenPayload.userLogin;
    const foundedComment: Comment | null = await this.CommentModel.findOne({
      id: commentId,
    });
    if (!foundedComment) {
      throw new NotFoundException();
    }
    await this.commandBus.execute(
      new ChangeEntityLikeStatusCommand({
        likeStatus: reaction,
        userId,
        userLogin,
        entityId: commentId,
        entity: 'comment',
      }),
    );
  }
}
