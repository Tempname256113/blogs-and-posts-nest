import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogBloggerApiCreateUpdateDTO } from '../../api/models/blog-blogger-api.dto';
import { NotFoundException } from '@nestjs/common';
import { BlogRepository } from '../../infrastructure/repositories/blog.repository';

export class UpdateBlogCommand {
  constructor(
    public readonly data: {
      blogId: string;
      updateBlogDTO: BlogBloggerApiCreateUpdateDTO;
    },
  ) {}
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase
  implements ICommandHandler<UpdateBlogCommand, void>
{
  constructor(private blogRepository: BlogRepository) {}

  async execute({
    data: { blogId, updateBlogDTO },
  }: UpdateBlogCommand): Promise<void> {
    const blogUpdateStatus: boolean = await this.blogRepository.updateBlog(
      blogId,
      updateBlogDTO,
    );
    if (!blogUpdateStatus) throw new NotFoundException();
  }
}
