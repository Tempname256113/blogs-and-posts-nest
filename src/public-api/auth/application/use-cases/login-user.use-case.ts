import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { User } from '../../../../../libs/db/mongoose/schemes/user.entity';
import {
  CreateNewTokensPairData,
  CreateNewTokensPairReturnType,
  JwtUtils,
} from '../../../../../libs/auth/jwt/jwt-utils.service';
import { AuthRepositorySql } from '../../infrastructure/repositories/auth.repository-sql';
import { randomUUID } from 'crypto';

export class LoginUserCommand {
  constructor(
    public readonly data: {
      user: User;
      clientIpAddress: string;
      clientDeviceTitle: string;
    },
  ) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase
  implements
    ICommandHandler<
      LoginUserCommand,
      { newAccessToken: string; newRefreshToken: string }
    >
{
  constructor(
    private jwtUtils: JwtUtils,
    private authRepositorySQL: AuthRepositorySql,
  ) {}

  async execute({
    data: { user, clientIpAddress, clientDeviceTitle },
  }: LoginUserCommand): Promise<{
    newAccessToken: string;
    newRefreshToken: string;
  }> {
    const uniqueKey: string = randomUUID();
    const deviceId: number = await this.authRepositorySQL.createNewSession({
      userId: user.id,
      uniqueKey,
      userIpAddress: clientIpAddress,
      userDeviceTitle: clientDeviceTitle,
    });
    const { newRefreshToken, newAccessToken } = this.createNewTokensPair({
      userId: Number(user.id),
      userLogin: user.accountData.login,
      deviceId: String(deviceId),
      uniqueKey,
    });
    return {
      newAccessToken,
      newRefreshToken,
    };
  }

  createNewTokensPair(
    createNewTokensPairDTO: CreateNewTokensPairData,
  ): CreateNewTokensPairReturnType {
    return this.jwtUtils.createNewTokensPair(createNewTokensPairDTO);
  }
}
