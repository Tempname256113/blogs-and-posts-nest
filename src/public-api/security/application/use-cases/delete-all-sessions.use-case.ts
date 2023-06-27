import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtRefreshTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import {
  Session,
  SessionSchema,
} from '../../../../../libs/db/mongoose/schemes/session.entity';
import { FilterQuery, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

export class DeleteAllSessionsExceptCurrentCommand {
  constructor(
    public readonly reqRefreshTokenPayload: JwtRefreshTokenPayloadType,
  ) {}
}

@CommandHandler(DeleteAllSessionsExceptCurrentCommand)
export class DeleteAllSessionsExceptCurrentUseCase
  implements ICommandHandler<DeleteAllSessionsExceptCurrentCommand, void>
{
  constructor(
    @InjectModel(SessionSchema.name) private SessionModel: Model<SessionSchema>,
  ) {}

  async execute({
    reqRefreshTokenPayload,
  }: DeleteAllSessionsExceptCurrentCommand): Promise<void> {
    const allFoundedSessions: Session[] = await this.SessionModel.find({
      userId: reqRefreshTokenPayload.userId,
    }).lean();
    const deviceIdForDeleteArray: number[] = [];
    for (const sessionFromDB of allFoundedSessions) {
      if (sessionFromDB.deviceId !== reqRefreshTokenPayload.deviceId) {
        deviceIdForDeleteArray.push(sessionFromDB.deviceId);
      }
    }
    const filter: FilterQuery<SessionSchema> = {
      deviceId: { $in: deviceIdForDeleteArray },
    };
    await this.SessionModel.deleteMany(filter);
  }
}
