import { Module } from '@nestjs/common';
import { MongooseSchemesModule } from '../../../libs/db/mongoose/mongoose.schemes-module';
import { SecurityController } from '../../public-api/security/api/security.controller';
import { JwtModule } from '../../../libs/auth/jwt/jwt.module';
import { AuthJwtRefreshTokenStrategy } from '../../../libs/auth/passport-strategy/auth-jwt-refresh-token.strategy';
import { SecurityQueryRepository } from '../../public-api/security/infrastructure/repositories/security.query-repository';
import { DeleteAllSessionsExceptCurrentUseCase } from '../../public-api/security/application/use-cases/delete-all-sessions.use-case';
import { DeleteSessionByDeviceIdUseCase } from '../../public-api/security/application/use-cases/delete-session-by-deviceId.use-case';
import { CqrsModule } from '@nestjs/cqrs';

const UseCases = [
  DeleteAllSessionsExceptCurrentUseCase,
  DeleteSessionByDeviceIdUseCase,
];

@Module({
  imports: [MongooseSchemesModule, JwtModule, CqrsModule],
  providers: [
    AuthJwtRefreshTokenStrategy,
    SecurityQueryRepository,
    ...UseCases,
  ],
  controllers: [SecurityController],
})
export class SecurityModule {}
