import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostApiCreateUpdateDTO } from '../../post-api-models/post-api.dto';
import { NotFoundException } from '@nestjs/common';
import { PostRepository } from '../../../post-infrastructure/post-repositories/post.repository';

export class UpdatePostCommand {
  constructor(
    public readonly data: {
      postId: string;
      postUpdateDTO: PostApiCreateUpdateDTO;
    },
  ) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase
  implements ICommandHandler<UpdatePostCommand, void>
{
  constructor(private postRepository: PostRepository) {}

  async execute({
    data: { postId, postUpdateDTO },
  }: UpdatePostCommand): Promise<void> {
    const postUpdateStatus: boolean = await this.postRepository.updatePost(
      postId,
      postUpdateDTO,
    );
    if (!postUpdateStatus) throw new NotFoundException();
  }
}
