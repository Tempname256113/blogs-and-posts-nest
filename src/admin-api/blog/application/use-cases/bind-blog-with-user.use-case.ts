import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { exceptionFactoryFunction } from '../../../../../generic-factory-functions/exception-factory.function';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/blog-sql.entity';
import { UserSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/users/user-sql.entity';

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
  constructor(
    @InjectRepository(BlogSQLEntity)
    private readonly blogEntity: Repository<BlogSQLEntity>,
    @InjectRepository(UserSQLEntity)
    private readonly userEntity: Repository<UserSQLEntity>,
  ) {}

  async execute({
    data: { blogId, userId },
  }: BindBlogWithUserCommand): Promise<void> {
    const errorFields: string[] = [];
    const checkCorrectIds = () => {
      if (!Number(blogId)) errorFields.push('id');
      if (!Number(userId)) errorFields.push('userId');
    };
    checkCorrectIds();
    const foundedBlog: BlogSQLEntity | null = await this.blogEntity.findOneBy({
      id: Number(blogId),
    });
    const foundedUser: UserSQLEntity | null = await this.userEntity.findOneBy({
      id: Number(userId),
    });
    let foundedBlogBloggerId: string | null = null;
    if (!foundedBlog) {
      errorFields.push('id');
    } else {
      foundedBlogBloggerId = String(foundedBlog.bloggerId);
    }
    if (!foundedUser || foundedBlogBloggerId) {
      errorFields.push('userId');
    }
    if (errorFields.length > 0) {
      throw new BadRequestException(exceptionFactoryFunction(errorFields));
    }
    await this.blogEntity.update(blogId, { bloggerId: Number(userId) });
  }
}
