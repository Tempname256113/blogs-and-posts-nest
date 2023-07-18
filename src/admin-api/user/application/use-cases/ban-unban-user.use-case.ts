import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserBanUnbanDTO } from '../../api/models/user-api.dto';
import { SecurityRepositorySQL } from '../../../../public-api/security/infrastructure/repositories/security.repository-sql';
import { UserRepositorySQL } from '../../infrastructure/repositories/user.repository-sql';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export class BanUnbanUserCommand {
  constructor(
    public readonly data: {
      userId: number;
      banUnbanDTO: UserBanUnbanDTO;
    },
  ) {}
}

@CommandHandler(BanUnbanUserCommand)
export class BanUnbanUserUseCase
  implements ICommandHandler<BanUnbanUserCommand, void>
{
  constructor(
    private readonly securityRepositorySQL: SecurityRepositorySQL,
    private readonly usersRepositorySQL: UserRepositorySQL,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async execute({
    data: { banUnbanDTO, userId },
  }: BanUnbanUserCommand): Promise<void> {
    if (banUnbanDTO.isBanned) {
      await this.banUser({ banReason: banUnbanDTO.banReason, userId });
    } else {
      await this.unbanUser(userId);
    }
  }

  async banUser({
    banReason,
    userId,
  }: {
    banReason: string;
    userId: number;
  }): Promise<void> {
    await this.securityRepositorySQL.deleteAllSessionsByUserId(userId);
    await this.usersRepositorySQL.banUnbanUserById({
      isBanned: true,
      banReason,
      userId,
    });
    const rawBlogsId: { id: number }[] = await this.dataSource.query(
      `
        SELECT b."id"
        FROM public.blogs b
        WHERE b."blogger_id" = $1
        `,
      [userId],
    );
    const blogsId: number[] = rawBlogsId.map((rawBlog) => Number(rawBlog.id));
    if (blogsId.length > 0) {
      const rawPostsId: [{ id: number }[]] = await this.dataSource.query(
        `
        UPDATE public.posts
        SET "hidden" = true
        WHERE "blog_id" IN (${blogsId})
        RETURNING "id"
        `,
      );
      const postsId: number[] = rawPostsId[0].map((rawPost) =>
        Number(rawPost.id),
      );
      if (postsId.length > 0) {
        await this.dataSource.query(
          `
        UPDATE public.comments
        SET "hidden" = true
        WHERE "post_id" IN (${postsId})
        `,
        );
      }
    }
    await this.dataSource.query(
      `
    UPDATE public.comments_likes
    SET "hidden" = true
    WHERE "user_id" = $1
    `,
      [userId],
    );
    await this.dataSource.query(
      `
    UPDATE public.posts_likes
    SET "hidden" = true
    WHERE "user_id" = $1
    `,
      [userId],
    );
    // await this.PostModel.updateMany({ bloggerId: userId }, { hidden: true });
    // await this.CommentModel.updateMany({ userId }, { hidden: true });
    // await this.LikeModel.updateMany({ userId }, { hidden: true });
  }

  async unbanUser(userId: number): Promise<void> {
    await this.usersRepositorySQL.banUnbanUserById({
      isBanned: false,
      userId,
    });
    const rawBlogsId: { id: number }[] = await this.dataSource.query(
      `
        SELECT b."id"
        FROM public.blogs b
        WHERE b."blogger_id" = $1
        `,
      [userId],
    );
    const blogsId: number[] = rawBlogsId.map((rawBlog) => Number(rawBlog.id));
    if (blogsId.length > 0) {
      const rawPostsId: [{ id: number }[]] = await this.dataSource.query(
        `
        UPDATE public.posts
        SET "hidden" = false
        WHERE "blog_id" IN (${blogsId})
        RETURNING "id"
        `,
      );
      const postsId: number[] = rawPostsId[0].map((rawPost) =>
        Number(rawPost.id),
      );
      if (postsId.length > 0) {
        await this.dataSource.query(
          `
            UPDATE public.comments
            SET "hidden" = false
            WHERE "post_id" IN (${postsId})
           `,
        );
      }
    }
    await this.dataSource.query(
      `
    UPDATE public.comments_likes
    SET "hidden" = false
    WHERE "user_id" = $1
    `,
      [userId],
    );
    await this.dataSource.query(
      `
    UPDATE public.posts_likes
    SET "hidden" = false
    WHERE "user_id" = $1
    `,
      [userId],
    );
    // await this.PostModel.updateMany({ bloggerId: userId }, { hidden: false });
    // await this.CommentModel.updateMany({ userId }, { hidden: false });
    // await this.LikeModel.updateMany({ userId }, { hidden: false });
  }
}
