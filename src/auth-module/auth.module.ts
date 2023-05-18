import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthController } from './auth/auth-api/auth-api-controllers/auth.controller';
import { AuthService } from './auth/auth-application/auth.service';
import { NodemailerModule } from '../../libs/email/nodemailer/nodemailer.module';
import { AuthRepository } from './auth/auth-infrastructure/auth-repositories/auth.repository';
import { AuthJwtAccessTokenStrategy } from '../../libs/auth/passport-strategy/auth-jwt-access-token.strategy';
import { AuthLocalStrategy } from '../../libs/auth/passport-strategy/auth-local.strategy';
import { UserRepository } from './user/user-infrastructure/user-repositories/user.repository';
import { MongooseSchemesModule } from '../../libs/db/mongoose/mongoose.schemes-module';
import { UserQueryRepository } from './user/user-infrastructure/user-repositories/user.query-repository';
import { JwtModule } from '../../libs/auth/jwt/jwt.module';
import { SecurityModule } from './security/security.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { RegistrationUserUseCase } from './auth/auth-application/auth-application-use-cases/registration-user.use-case';
import { CqrsModule } from '@nestjs/cqrs';
import { ValidateUserUseCase } from './auth/auth-application/auth-application-use-cases/validate-user.use-case';
import { LoginUserUseCase } from './auth/auth-application/auth-application-use-cases/login-user.use-case';
import { RegistrationConfirmUseCase } from './auth/auth-application/auth-application-use-cases/registration-confirm.use-case';
import { ResendConfirmationEmailUseCase } from './auth/auth-application/auth-application-use-cases/resend-confirmation-email.use-case';

const UseCases = [
  RegistrationUserUseCase,
  ValidateUserUseCase,
  LoginUserUseCase,
  RegistrationConfirmUseCase,
  ResendConfirmationEmailUseCase,
];

@Module({
  imports: [
    MongooseSchemesModule,
    UserModule,
    NodemailerModule,
    JwtModule,
    SecurityModule,
    ThrottlerModule.forRoot({ ttl: 10, limit: 5 }),
    CqrsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    AuthJwtAccessTokenStrategy,
    AuthLocalStrategy,
    UserRepository,
    UserQueryRepository,
    ...UseCases,
  ],
})
export class AuthModule {}
