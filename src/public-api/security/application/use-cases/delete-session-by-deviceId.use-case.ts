import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtRefreshTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import {
  Session,
  SessionSchema,
} from '../../../../../libs/db/mongoose/schemes/session.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

export class DeleteSessionByDeviceIdCommand {
  constructor(
    public readonly data: {
      deviceId: string;
      refreshTokenPayload: JwtRefreshTokenPayloadType;
    },
  ) {}
}

@CommandHandler(DeleteSessionByDeviceIdCommand)
export class DeleteSessionByDeviceIdUseCase
  implements ICommandHandler<DeleteSessionByDeviceIdCommand, void>
{
  constructor(
    @InjectModel(SessionSchema.name) private SessionModel: Model<SessionSchema>,
  ) {}

  async execute({ data }: DeleteSessionByDeviceIdCommand): Promise<void> {
    const foundedSessionByDeviceId: Session | null =
      await this.SessionModel.findOne({
        deviceId: data.deviceId,
      }).lean();
    if (!foundedSessionByDeviceId) {
      throw new NotFoundException();
    }
    if (foundedSessionByDeviceId.userId !== data.refreshTokenPayload.userId) {
      throw new ForbiddenException();
    }
    await this.SessionModel.deleteOne({ deviceId: data.deviceId });
  }
}
