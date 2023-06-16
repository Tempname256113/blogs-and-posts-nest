import { ICommandHandler } from '@nestjs/cqrs';
import { BanBlogAdminApiDTO } from '../../api/models/blog-admin-api.dto';

export class BanUnbanBlogCommand {
  constructor(
    public readonly data: { banBlogDTO: BanBlogAdminApiDTO; blogId: string },
  ) {}
}

export class BanUnbanBlogUseCase
  implements ICommandHandler<BanUnbanBlogCommand, void>
{
  async execute({
    data: { banBlogDTO, blogId },
  }: BanUnbanBlogCommand): Promise<void> {}
}
