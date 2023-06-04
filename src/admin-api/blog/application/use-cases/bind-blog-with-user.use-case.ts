import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import {
  Blog,
  BlogSchema,
} from '../../../../../libs/db/mongoose/schemes/blog.entity';
import { Model } from 'mongoose';
import { BadRequestException } from '@nestjs/common';
import {
  User,
  UserSchema,
} from '../../../../../libs/db/mongoose/schemes/user.entity';
import { badRequestErrorFactoryFunction } from '../../../../../generic-factory-functions/bad-request.error-factory-function';

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
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
  ) {}

  async execute({
    data: { blogId, userId },
  }: BindBlogWithUserCommand): Promise<void> {
    const foundedBlog: Blog | null = await this.BlogModel.findOne({
      id: blogId,
    }).lean();
    const foundedUser: User | null = await this.UserModel.findOne({
      id: userId,
    });
    const errorFields: string[] = [];
    if (!foundedUser || foundedBlog.bloggerId) {
      errorFields.push('userId');
    }
    if (!foundedBlog) {
      errorFields.push('id');
    }
    if (errorFields.length > 0) {
      throw new BadRequestException(
        badRequestErrorFactoryFunction(errorFields),
      );
    }
    await this.BlogModel.updateOne(
      { id: blogId },
      {
        bloggerId: foundedUser.id,
        bloggerLogin: foundedUser.accountData.login,
      },
    );
  }
}
