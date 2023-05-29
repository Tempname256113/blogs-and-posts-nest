import { Module } from '@nestjs/common';
import { MongooseSchemesModule } from '../../../libs/db/mongoose/mongoose.schemes-module';
import { SecurityService } from './security-application/security.service';
import { SecurityController } from './security-api/security.controller';
import { JwtModule } from '../../../libs/auth/jwt/jwt.module';
import { AuthJwtRefreshTokenStrategy } from '../../../libs/auth/passport-strategy/auth-jwt-refresh-token.strategy';
import { SecurityQueryRepository } from './security-infrastructure/security-repositories/security.query-repository';
import { DeleteAllSessionsExceptCurrentUseCase } from './security-application/security-application-use-cases/delete-all-sessions.use-case';
import { DeleteSessionByDeviceIdUseCase } from './security-application/security-application-use-cases/delete-session-by-deviceId.use-case';
import { CqrsModule } from '@nestjs/cqrs';

const UseCases = [
  DeleteAllSessionsExceptCurrentUseCase,
  DeleteSessionByDeviceIdUseCase,
];

@Module({
  imports: [MongooseSchemesModule, JwtModule, CqrsModule],
  providers: [
    SecurityService,
    AuthJwtRefreshTokenStrategy,
    SecurityQueryRepository,
    ...UseCases,
  ],
  controllers: [SecurityController],
})
export class SecurityModule {}
