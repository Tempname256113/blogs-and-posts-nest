import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthController } from './auth/auth-api/auth.controller';
import { AuthService } from './auth/auth-application/auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { userSchema, UserSchema } from './auth-module-domain/user/user.entity';
import { AuthEmailAdapterModule } from './auth/auth-infrastructure/auth-adapters/auth.email-adapter.module';
import { AuthRepository } from './auth/auth-infrastructure/auth-repositories/auth.repository';
import { JwtModule } from '@nestjs/jwt';
import { EnvConfiguration } from '../app-configuration/env-configuration';
import { AuthJwtStrategy } from '../app-configuration/passport-strategy/auth-jwt.strategy';
import { AuthLocalStrategy } from '../app-configuration/passport-strategy/auth-local.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserSchema.name, schema: userSchema }]),
    UserModule,
    AuthEmailAdapterModule,
    JwtModule.register({
      secret: new EnvConfiguration().JWT_SECRET_ACCESS_TOKEN,
      signOptions: { expiresIn: '15min' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, AuthJwtStrategy, AuthLocalStrategy],
})
export class AuthModule {}
