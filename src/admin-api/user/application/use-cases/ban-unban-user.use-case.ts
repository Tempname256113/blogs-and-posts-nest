import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserBanUnbanDTO } from '../../api/models/user-api.dto';
import { SecurityRepositorySQL } from '../../../../public-api/security/infrastructure/repositories/security.repository-sql';
import { UserRepositorySQL } from '../../infrastructure/repositories/user.repository-sql';

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
    // await this.PostModel.updateMany({ bloggerId: userId }, { hidden: true });
    // await this.CommentModel.updateMany({ userId }, { hidden: true });
    // await this.LikeModel.updateMany({ userId }, { hidden: true });
  }

  async unbanUser(userId: number): Promise<void> {
    await this.usersRepositorySQL.banUnbanUserById({
      isBanned: false,
      userId,
    });
    // await this.PostModel.updateMany({ bloggerId: userId }, { hidden: false });
    // await this.CommentModel.updateMany({ userId }, { hidden: false });
    // await this.LikeModel.updateMany({ userId }, { hidden: false });
  }
}
