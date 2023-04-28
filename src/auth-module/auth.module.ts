import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthController } from './auth/auth-api/auth-api-controllers/auth.controller';
import { AuthService } from './auth/auth-application/auth.service';
import { AuthEmailAdapterModule } from './auth/auth-infrastructure/auth-adapters/auth.email-adapter.module';
import { AuthRepository } from './auth/auth-infrastructure/auth-repositories/auth.repository';
import { AuthJwtStrategy } from '../app-helpers/passport-strategy/auth-jwt.strategy';
import { AuthLocalStrategy } from '../app-helpers/passport-strategy/auth-local.strategy';
import { UserRepository } from './user/user-infrastructure/user-repositories/user.repository';
import { MongooseSchemesModule } from '../app-configuration/db/mongoose.schemes-module';
import { UserQueryRepository } from './user/user-infrastructure/user-repositories/user.query-repository';
import { JwtModule } from '../app-helpers/jwt/jwt.module';

@Module({
  imports: [
    MongooseSchemesModule,
    UserModule,
    AuthEmailAdapterModule,
    JwtModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    AuthJwtStrategy,
    AuthLocalStrategy,
    UserRepository,
    UserQueryRepository,
  ],
})
export class AuthModule {}
