import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtRefreshTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export class DeleteAllSessionsExceptCurrentCommand {
  constructor(
    public readonly reqRefreshTokenPayload: JwtRefreshTokenPayloadType,
  ) {}
}

@CommandHandler(DeleteAllSessionsExceptCurrentCommand)
export class DeleteAllSessionsExceptCurrentUseCase
  implements ICommandHandler<DeleteAllSessionsExceptCurrentCommand, void>
{
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async execute({
    reqRefreshTokenPayload,
  }: DeleteAllSessionsExceptCurrentCommand): Promise<void> {
    await this.dataSource.query(
      `
    DELETE FROM public.sessions s
    WHERE s.user_id = $1 AND s.device_id != $2
    `,
      [reqRefreshTokenPayload.userId, reqRefreshTokenPayload.deviceId],
    );
  }
}
