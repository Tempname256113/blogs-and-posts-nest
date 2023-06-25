import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserBanUnbanDTO } from '../../api/models/user-api.dto';
import { InjectModel } from '@nestjs/mongoose';
import { SessionSchema } from '../../../../../libs/db/mongoose/schemes/session.entity';
import { Model } from 'mongoose';
import { PostSchema } from '../../../../../libs/db/mongoose/schemes/post.entity';
import { CommentSchema } from '../../../../../libs/db/mongoose/schemes/comment.entity';
import { LikeSchema } from '../../../../../libs/db/mongoose/schemes/like.entity';
import {
  UserBanInfo,
  UserSchema,
} from '../../../../../libs/db/mongoose/schemes/user.entity';

export class BanUnbanUserCommand {
  constructor(
    public readonly data: {
      userId: string;
      banUnbanDTO: UserBanUnbanDTO;
    },
  ) {}
}

@CommandHandler(BanUnbanUserCommand)
export class BanUnbanUserUseCase
  implements ICommandHandler<BanUnbanUserCommand, void>
{
  constructor(
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    @InjectModel(SessionSchema.name) private SessionModel: Model<SessionSchema>,
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    @InjectModel(CommentSchema.name) private CommentModel: Model<CommentSchema>,
    @InjectModel(LikeSchema.name) private LikeModel: Model<LikeSchema>,
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
    userId: string;
  }): Promise<void> {
    await this.SessionModel.deleteMany({ userId });
    const updateUserBanStatusDTO: UserBanInfo = {
      isBanned: true,
      banReason: banReason,
      banDate: new Date().toISOString(),
    };
    await this.UserModel.updateOne(
      { id: userId },
      { banStatus: updateUserBanStatusDTO },
    );
    await this.PostModel.updateMany({ bloggerId: userId }, { hidden: true });
    await this.CommentModel.updateMany({ userId }, { hidden: true });
    await this.LikeModel.updateMany({ userId }, { hidden: true });
  }

  async unbanUser(userId: string): Promise<void> {
    const updateUserBanStatusDTO: UserBanInfo = {
      isBanned: false,
      banReason: null,
      banDate: null,
    };
    await this.UserModel.updateOne(
      { id: userId },
      { banStatus: updateUserBanStatusDTO },
    );
    await this.PostModel.updateMany({ bloggerId: userId }, { hidden: false });
    await this.CommentModel.updateMany({ userId }, { hidden: false });
    await this.LikeModel.updateMany({ userId }, { hidden: false });
  }
}
