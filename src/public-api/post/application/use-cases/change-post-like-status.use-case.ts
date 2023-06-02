import {
  Post,
  PostSchema,
} from '../../../../../libs/db/mongoose/schemes/post.entity';
import { NotFoundException } from '@nestjs/common';
import { ChangeEntityLikeStatusCommand } from '../../../like/application/use-cases/change-entity-like-status.use-case';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PostPublicQueryRepository } from '../../infrastructure/repositories/post.query-repository';

export class ChangePostLikeStatusCommand {
  constructor(
    public readonly data: {
      postId: string;
      likeStatus: 'Like' | 'Dislike' | 'None';
      userId: string;
      userLogin: string;
    },
  ) {}
}

@CommandHandler(ChangePostLikeStatusCommand)
export class ChangePostLikeStatusUseCase
  implements ICommandHandler<ChangePostLikeStatusCommand, void>
{
  constructor(
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    private commandBus: CommandBus,
    private postQueryRepository: PostPublicQueryRepository,
  ) {}

  async execute({
    data: { postId, likeStatus, userId, userLogin },
  }: ChangePostLikeStatusCommand): Promise<void> {
    const foundedPost: Post | null =
      await this.postQueryRepository.getRawPostById(postId);
    if (!foundedPost) {
      throw new NotFoundException();
    }
    await this.commandBus.execute(
      new ChangeEntityLikeStatusCommand({
        likeStatus,
        entity: 'post',
        entityId: postId,
        userId,
        userLogin,
      }),
    );
  }
}
