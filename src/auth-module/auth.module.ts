import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthController } from './auth/auth-api/auth.controller';
import { AuthService } from './auth/auth-application/auth.service';
import { AuthEmailAdapterModule } from './auth/auth-infrastructure/auth-adapters/auth.email-adapter.module';
import { AuthRepository } from './auth/auth-infrastructure/auth-repositories/auth.repository';
import { JwtService } from '@nestjs/jwt';
import { EnvConfiguration } from '../app-configuration/environment/env-configuration';
import { AuthJwtStrategy } from '../app-configuration/passport-strategy/auth-jwt.strategy';
import { AuthLocalStrategy } from '../app-configuration/passport-strategy/auth-local.strategy';
import { UserRepository } from './user/user-infrastructure/user-repositories/user.repository';
import { MongooseSchemesModule } from '../app-configuration/db/mongoose.schemes-module';

@Module({
  imports: [MongooseSchemesModule, UserModule, AuthEmailAdapterModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    AuthJwtStrategy,
    AuthLocalStrategy,
    JwtService,
    EnvConfiguration,
    UserRepository,
  ],
})
export class AuthModule {}
