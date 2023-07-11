import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BanBlogAdminApiDTO } from '../../api/models/blog-admin-api.dto';
import { InjectModel } from '@nestjs/mongoose';
import { BlogSchema } from '../../../../../libs/db/mongoose/schemes/blog.entity';
import { Model } from 'mongoose';
import { PostSchema } from '../../../../../libs/db/mongoose/schemes/post.entity';
import { CommentSchema } from '../../../../../libs/db/mongoose/schemes/comment.entity';
import { LikeSchema } from '../../../../../libs/db/mongoose/schemes/like.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export class BanUnbanBlogCommand {
  constructor(
    public readonly data: { banBlogDTO: BanBlogAdminApiDTO; blogId: string },
  ) {}
}

@CommandHandler(BanUnbanBlogCommand)
export class BanUnbanBlogUseCase
  implements ICommandHandler<BanUnbanBlogCommand, void>
{
  constructor(
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    @InjectModel(CommentSchema.name) private CommentModel: Model<CommentSchema>,
    @InjectModel(LikeSchema.name) private LikeModel: Model<LikeSchema>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async execute({
    data: { banBlogDTO, blogId },
  }: BanUnbanBlogCommand): Promise<void> {
    if (banBlogDTO.isBanned) {
      await this.banBlog(blogId);
    } else {
      await this.unbanBlog(blogId);
    }
  }

  async banBlog(blogId: string): Promise<void> {
    const hideBlogs = async (): Promise<void> => {
      await this.dataSource.query(
        `
      UPDATE public.blogs
      SET "hidden" = true, "is_banned" = true, "ban_date" = now()
      WHERE id = $1
      `,
        [blogId],
      );
    };
    await hideBlogs();
    const hidePosts = async (): Promise<void> => {
      await this.dataSource.query(
        `
      UPDATE public.posts
      SET "hidden" = true
      WHERE "blog_id" = $1
      `,
        [blogId],
      );
    };
    await hidePosts();
    // await this.BlogModel.updateMany(
    //   { id: blogId },
    //   { hidden: true, isBanned: true, banDate: new Date().toISOString() },
    // );
    // await this.PostModel.updateMany({ blogId }, { hidden: true });
    // await this.CommentModel.updateMany({ blogId }, { hidden: true });
    // await this.LikeModel.updateMany({ blogId }, { hidden: true });
  }

  async unbanBlog(blogId: string): Promise<void> {
    const revealBlogs = async (): Promise<void> => {
      await this.dataSource.query(
        `
      UPDATE public.blogs
      SET "hidden" = false, "is_banned" = false, "ban_date" = null
      WHERE id = $1
      `,
        [blogId],
      );
    };
    await revealBlogs();
    const revealPosts = async (): Promise<void> => {
      await this.dataSource.query(
        `
      UPDATE public.posts
      SET "hidden" = false
      WHERE "blog_id" = $1
      `,
        [blogId],
      );
    };
    await revealPosts();
    // await this.BlogModel.updateMany(
    //   { id: blogId },
    //   { hidden: false, isBanned: false, banDate: null },
    // );
    // await this.PostModel.updateMany({ blogId }, { hidden: false });
    // await this.CommentModel.updateMany({ blogId }, { hidden: false });
    // await this.LikeModel.updateMany({ blogId }, { hidden: false });
  }
}
