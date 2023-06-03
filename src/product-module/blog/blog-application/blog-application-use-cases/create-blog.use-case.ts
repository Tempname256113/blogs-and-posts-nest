import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogApiCreateUpdateDTO } from '../../blog-api/blog-api-models/blog-api.dto';
import { BlogApiModelType } from '../../blog-api/blog-api-models/blog-api.models';
import {
  Blog,
  BlogDocument,
  BlogSchema,
} from '../../../../../libs/db/mongoose/schemes/blog.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlogRepository } from '../../blog-infrastructure/blog-repositories/blog.repository';
import { v4 as uuidv4 } from 'uuid';

export class CreateBlogCommand {
  constructor(public readonly createBlogDTO: BlogApiCreateUpdateDTO) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase
  implements ICommandHandler<CreateBlogCommand, BlogApiModelType>
{
  constructor(
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    private blogRepository: BlogRepository,
  ) {}

  async execute({
    createBlogDTO,
  }: CreateBlogCommand): Promise<BlogApiModelType> {
    const newBlog: Blog = {
      id: uuidv4(),
      bloggerId: 'mock blogger id',
      bloggerLogin: 'mock blogger login',
      name: createBlogDTO.name,
      description: createBlogDTO.description,
      websiteUrl: createBlogDTO.websiteUrl,
      createdAt: new Date().toISOString(),
      isMembership: false,
    };
    const newBlogModel: BlogDocument = new this.BlogModel(newBlog);
    await this.blogRepository.saveBlogOrPost(newBlogModel);
    return newBlog;
  }
}
