import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BanBlogAdminApiDTO } from '../../api/models/blog-admin-api.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BlogSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/blog-sql.entity';
import { PostSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/post-sql.entity';

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
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(BlogSQLEntity)
    private readonly blogEntity: Repository<BlogSQLEntity>,
    @InjectRepository(PostSQLEntity)
    private readonly postEntity: Repository<PostSQLEntity>,
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
      await this.blogEntity.update(blogId, {
        hidden: true,
        isBanned: true,
        banDate: new Date().toISOString(),
      });
    };
    const hidePosts = async (): Promise<void> => {
      await this.postEntity.update(
        { blogId: Number(blogId) },
        { hidden: true },
      );
    };
    /* после скрытия постов я не скрывал лайки и комменты потому что если нет поста
     * то следовательно не будет его лайков и комментов тоже. по идее должно сработать
     * если нет, то придется дописывать */
    await Promise.all([hideBlogs(), hidePosts()]);
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
      await this.blogEntity.update(blogId, {
        hidden: false,
        isBanned: false,
        banDate: null,
      });
    };
    const revealPosts = async (): Promise<void> => {
      await this.postEntity.update(
        { blogId: Number(blogId) },
        { hidden: false },
      );
    };
    await Promise.all([revealBlogs(), revealPosts()]);
    // await this.BlogModel.updateMany(
    //   { id: blogId },
    //   { hidden: false, isBanned: false, banDate: null },
    // );
    // await this.PostModel.updateMany({ blogId }, { hidden: false });
    // await this.CommentModel.updateMany({ blogId }, { hidden: false });
    // await this.LikeModel.updateMany({ blogId }, { hidden: false });
  }
}
