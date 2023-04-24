import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthController } from './auth/auth-api/auth.controller';
import { AuthService } from './auth/auth-application/auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { userSchema, UserSchema } from './auth-module-domain/user/user.entity';
import { AuthEmailAdapterModule } from './auth/auth-infrastructure/auth-adapters/auth.email-adapter.module';
import { AuthRepository } from './auth/auth-infrastructure/auth-repositories/auth.repository';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { EnvConfiguration } from '../app-configuration/env-configuration';
import { AuthJwtStrategy } from '../app-configuration/passport-strategy/auth-jwt.strategy';
import { AuthLocalStrategy } from '../app-configuration/passport-strategy/auth-local.strategy';
import {
  sessionSchema,
  SessionSchema,
} from './auth-module-domain/auth/session.entity';
import { UserRepository } from './user/user-infrastructure/user-repositories/user.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSchema.name, schema: userSchema },
      { name: SessionSchema.name, schema: sessionSchema },
    ]),
    UserModule,
    AuthEmailAdapterModule,
    JwtModule.register({
      secret: new EnvConfiguration().JWT_SECRET_ACCESS_TOKEN,
      signOptions: { expiresIn: '15min' },
    }),
  ],
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
