import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtRefreshTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SecurityQueryRepositorySQL } from '../../infrastructure/repositories/security.query-repository-sql';
import { SessionRepositoryType } from '../../../auth/infrastructure/repositories/models/auth-repository.dto';
import { SecurityRepositorySQL } from '../../infrastructure/repositories/security.repository-sql';

export class DeleteSessionByDeviceIdCommand {
  constructor(
    public readonly data: {
      deviceId: number;
      refreshTokenPayload: JwtRefreshTokenPayloadType;
    },
  ) {}
}

@CommandHandler(DeleteSessionByDeviceIdCommand)
export class DeleteSessionByDeviceIdUseCase
  implements ICommandHandler<DeleteSessionByDeviceIdCommand, void>
{
  constructor(
    private readonly securityQueryRepositorySQL: SecurityQueryRepositorySQL,
    private readonly securityRepositorySQL: SecurityRepositorySQL,
  ) {}

  async execute({ data }: DeleteSessionByDeviceIdCommand): Promise<void> {
    const foundedSessionByDeviceId: SessionRepositoryType | null =
      await this.securityQueryRepositorySQL.getSessionByDeviceId(data.deviceId);
    if (!foundedSessionByDeviceId) {
      throw new NotFoundException();
    }
    if (foundedSessionByDeviceId.userId !== data.refreshTokenPayload.userId) {
      throw new ForbiddenException();
    }
    await this.securityRepositorySQL.deleteSessionByDeviceId(data.deviceId);
  }
}
