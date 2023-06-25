import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { User } from '../../../../../libs/db/mongoose/schemes/user.entity';
import {
  CreateNewTokenPairReturnType,
  JwtUtils,
} from '../../../../../libs/auth/jwt/jwt-utils.service';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';

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
    private jwtHelpers: JwtUtils,
    private authRepository: AuthRepository,
  ) {}

  async execute({
    data: { user, clientIpAddress, clientDeviceTitle },
  }: LoginUserCommand): Promise<{
    newAccessToken: string;
    newRefreshToken: string;
  }> {
    const { newRefreshToken, newAccessToken } = this.createNewTokensPair(user);
    await this.authRepository.createNewSession({
      userId: user.id,
      deviceId: newRefreshToken.deviceId,
      refreshTokenIat: newRefreshToken.iat,
      userIpAddress: clientIpAddress,
      userDeviceTitle: clientDeviceTitle,
    });
    return {
      newAccessToken,
      newRefreshToken: newRefreshToken.refreshToken,
    };
  }

  createNewTokensPair(user: User): CreateNewTokenPairReturnType {
    return this.jwtHelpers.createNewTokenPair({
      userId: user.id,
      userLogin: user.accountData.login,
    });
  }
}
