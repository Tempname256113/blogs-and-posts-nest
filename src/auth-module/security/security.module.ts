import { Module } from '@nestjs/common';
import { MongooseSchemesModule } from '../../../libs/db/mongoose/mongoose.schemes-module';
import { SecurityService } from './security-application/security.service';
import { SecurityController } from './security-api/security.controller';
import { JwtModule } from '../../../libs/auth/jwt/jwt.module';
import { AuthJwtRefreshTokenStrategy } from '../../../libs/auth/passport-strategy/auth-jwt-refresh-token.strategy';
import { SecurityQueryRepository } from './security-infrastructure/security-repositories/security.query-repository';

@Module({
  imports: [MongooseSchemesModule, JwtModule],
  providers: [
    SecurityService,
    AuthJwtRefreshTokenStrategy,
    SecurityQueryRepository,
  ],
  controllers: [SecurityController],
})
export class SecurityModule {}
