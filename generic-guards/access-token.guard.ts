import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtUtils } from '../libs/auth/jwt/jwt-utils.service';
import { JwtAccessTokenPayloadType } from '../generic-models/jwt.payload.model';
import { UserQueryRepositorySQL } from '../src/admin-api/user/infrastructure/repositories/user.query-repository-sql';
import { User } from '../libs/db/mongoose/schemes/user.entity';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtHelpers: JwtUtils,
    private readonly usersQueryRepository: UserQueryRepositorySQL,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    if (!request.headers.authorization) throw new UnauthorizedException();
    const headersAuthorization: string[] =
      request.headers.authorization.split(' ');
    if (headersAuthorization[0] !== 'Bearer') throw new UnauthorizedException();
    if (!headersAuthorization[1]) throw new UnauthorizedException();
    const accessToken: string = headersAuthorization[1];
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtHelpers.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const foundedUserByLogin: User | null =
      await this.usersQueryRepository.findUserWithSimilarLoginOrEmail({
        login: accessTokenPayload.userLogin,
      });
    if (!foundedUserByLogin) throw new UnauthorizedException();
    return true;
  }
}
