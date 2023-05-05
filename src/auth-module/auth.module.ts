import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthController } from './auth/auth-api/auth-api-controllers/auth.controller';
import { AuthService } from './auth/auth-application/auth.service';
import { NodemailerModule } from '../../libs/email/nodemailer/nodemailer.module';
import { AuthRepository } from './auth/auth-infrastructure/auth-repositories/auth.repository';
import { AuthJwtStrategy } from '../../libs/auth/passport-strategy/auth-jwt.strategy';
import { AuthLocalStrategy } from '../../libs/auth/passport-strategy/auth-local.strategy';
import { UserRepository } from './user/user-infrastructure/user-repositories/user.repository';
import { MongooseSchemesModule } from '../../libs/db/mongoose/mongoose.schemes-module';
import { UserQueryRepository } from './user/user-infrastructure/user-repositories/user.query-repository';
import { JwtModule } from '../../libs/auth/jwt/jwt.module';

@Module({
  imports: [MongooseSchemesModule, UserModule, NodemailerModule, JwtModule],
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
