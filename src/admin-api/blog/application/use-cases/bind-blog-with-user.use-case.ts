import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { exceptionFactoryFunction } from '../../../../../generic-factory-functions/exception-factory.function';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export class BindBlogWithUserCommand {
  constructor(
    public readonly data: {
      blogId: string;
      userId: string;
    },
  ) {}
}

@CommandHandler(BindBlogWithUserCommand)
export class BindBlogWithUserUseCase
  implements ICommandHandler<BindBlogWithUserCommand, void>
{
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async execute({
    data: { blogId, userId },
  }: BindBlogWithUserCommand): Promise<void> {
    const errorFields: string[] = [];
    if (!Number(blogId)) errorFields.push('id');
    if (!Number(userId)) errorFields.push('userId');
    const rawFoundedBlog: any[] = await this.dataSource.query(
      `
    SELECT b."blogger_id"
    FROM public.blogs b
    WHERE b."id" = $1
    `,
      [blogId],
    );
    const rawFoundedUser: any[] = await this.dataSource.query(
      `
    SELECT u."id"
    FROM public.users u
    WHERE u."id" = $1
    `,
      [userId],
    );
    let foundedBlogBloggerId: string | null = null;
    if (rawFoundedBlog.length < 1) {
      errorFields.push('id');
    } else {
      foundedBlogBloggerId = rawFoundedBlog[0].blogger_id;
    }
    if (rawFoundedUser.length < 1 || foundedBlogBloggerId) {
      errorFields.push('userId');
    }
    if (errorFields.length > 0) {
      throw new BadRequestException(exceptionFactoryFunction(errorFields));
    }
    await this.dataSource.query(
      `
    UPDATE public.blogs
    SET "blogger_id" = $1
    WHERE "id" = $2
    `,
      [userId, blogId],
    );
  }
}
