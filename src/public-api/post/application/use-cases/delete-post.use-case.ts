import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PostRepository } from '../../infrastructure/repositories/post.repository';

export class DeletePostCommand {
  constructor(public readonly postId: string) {}
}

@CommandHandler(DeletePostCommand)
export class DeletePostUseCase
  implements ICommandHandler<DeletePostCommand, void>
{
  constructor(private postRepository: PostRepository) {}

  async execute({ postId }: DeletePostCommand): Promise<void> {
    const postDeleteStatus: boolean = await this.postRepository.deletePost(
      postId,
    );
    if (!postDeleteStatus) throw new NotFoundException();
  }
}
