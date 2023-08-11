import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserBanUnbanDTO } from '../../api/models/user-api.dto';
import { SecurityRepositorySQL } from '../../../../public-api/security/infrastructure/repositories/security.repository-sql';
import { UserRepositorySQL } from '../../infrastructure/repositories/user.repository-sql';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository, SelectQueryBuilder } from 'typeorm';
import { BlogSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/blog-sql.entity';
import { PostSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/post-sql.entity';
import { CommentSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/comment-sql.entity';
import { LikeSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/like-sql.entity';

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
    @InjectRepository(PostSQLEntity)
    private readonly postEntity: Repository<PostSQLEntity>,
    @InjectRepository(CommentSQLEntity)
    private readonly commentEntity: Repository<CommentSQLEntity>,
    @InjectRepository(LikeSQLEntity)
    private readonly likeEntity: Repository<LikeSQLEntity>,
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
    const blogsId: number[] = await this.getBlogsIds(userId);
    if (blogsId.length > 0) {
      await this.postEntity.update({ blogId: In(blogsId) }, { hidden: true });
    }
    await this.commentEntity.update({ userId }, { hidden: true });
    await this.likeEntity.update({ userId }, { hidden: true });
    // await this.PostModel.updateMany({ bloggerId: userId }, { hidden: true });
    // await this.CommentModel.updateMany({ userId }, { hidden: true });
    // await this.LikeModel.updateMany({ userId }, { hidden: true });
  }

  async unbanUser(userId: number): Promise<void> {
    await this.usersRepositorySQL.banUnbanUserById({
      isBanned: false,
      userId,
    });
    const blogsId: number[] = await this.getBlogsIds(userId);
    if (blogsId.length > 0) {
      await this.postEntity.update({ blogId: In(blogsId) }, { hidden: false });
    }
    await this.commentEntity.update({ userId }, { hidden: false });
    await this.likeEntity.update({ userId }, { hidden: false });
    // await this.PostModel.updateMany({ bloggerId: userId }, { hidden: false });
    // await this.CommentModel.updateMany({ userId }, { hidden: false });
    // await this.LikeModel.updateMany({ userId }, { hidden: false });
  }

  async getBlogsIds(userId: number): Promise<number[]> {
    const queryBuilder: SelectQueryBuilder<BlogSQLEntity> =
      await this.dataSource.createQueryBuilder(BlogSQLEntity, 'b');
    const rawBlogsIds: { b_id: number }[] = await queryBuilder
      .select(['b.id'])
      .where('b.bloggerId = :bloggerId', { bloggerId: userId })
      .getRawMany();
    return rawBlogsIds.map((rawBlog) => {
      return rawBlog.b_id;
    });
  }
}
