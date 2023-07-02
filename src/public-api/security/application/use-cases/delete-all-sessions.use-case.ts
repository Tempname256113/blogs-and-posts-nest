import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtRefreshTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { SecurityRepositorySQL } from '../../infrastructure/repositories/security.repository-sql';

export class DeleteAllSessionsExceptCurrentCommand {
  constructor(
    public readonly reqRefreshTokenPayload: JwtRefreshTokenPayloadType,
  ) {}
}

@CommandHandler(DeleteAllSessionsExceptCurrentCommand)
export class DeleteAllSessionsExceptCurrentUseCase
  implements ICommandHandler<DeleteAllSessionsExceptCurrentCommand, void>
{
  constructor(private readonly securityRepositorySQL: SecurityRepositorySQL) {}

  async execute({
    reqRefreshTokenPayload,
  }: DeleteAllSessionsExceptCurrentCommand): Promise<void> {
    await this.securityRepositorySQL.deleteAllSessionsExceptCurrent({
      userId: reqRefreshTokenPayload.userId,
      deviceId: Number(reqRefreshTokenPayload.deviceId),
    });
  }
}
