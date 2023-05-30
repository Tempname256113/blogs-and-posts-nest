import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { BlogRepository } from '../../infrastructure/repositories/blog.repository';

export class DeleteBlogCommand {
  constructor(public readonly blogId: string) {}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase
  implements ICommandHandler<DeleteBlogCommand, void>
{
  constructor(private blogRepository: BlogRepository) {}

  async execute({ blogId }: DeleteBlogCommand): Promise<void> {
    const deleteBlogStatus: boolean = await this.blogRepository.deleteBlog(
      blogId,
    );
    if (!deleteBlogStatus) throw new NotFoundException();
  }
}
