import { Module } from '@nestjs/common';
import { UserModule } from '../../admin-api/user/user.module';
import { AuthController } from './api/auth.controller';
import { NodemailerModule } from '../../../libs/email/nodemailer/nodemailer.module';
import { AuthRepository } from './infrastructure/auth.repository';
import { AuthJwtAccessTokenStrategy } from '../../../libs/auth/passport-strategy/auth-jwt-access-token.strategy';
import { AuthLocalStrategy } from '../../../libs/auth/passport-strategy/auth-local.strategy';
import { MongooseSchemesModule } from '../../../libs/db/mongoose/mongoose.schemes-module';
import { JwtModule } from '../../../libs/auth/jwt/jwt.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { RegistrationUserUseCase } from './application/use-cases/registration-user.use-case';
import { CqrsModule } from '@nestjs/cqrs';
import { ValidateUserUseCase } from './application/use-cases/validate-user.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { RegistrationConfirmUseCase } from './application/use-cases/registration-confirm.use-case';
import { ResendConfirmationEmailUseCase } from './application/use-cases/resend-confirmation-email.use-case';
import { UpdateTokensPairUseCase } from './application/use-cases/update-tokens-pair.use-case';
import { SendPasswordRecoveryCodeUseCase } from './application/use-cases/send-password-recovery-code.use-case';
import { SetNewPasswordUseCase } from './application/use-cases/set-new-password.use-case';

const UseCases = [
  RegistrationUserUseCase,
  ValidateUserUseCase,
  LoginUserUseCase,
  RegistrationConfirmUseCase,
  ResendConfirmationEmailUseCase,
  UpdateTokensPairUseCase,
  SendPasswordRecoveryCodeUseCase,
  SetNewPasswordUseCase,
];

@Module({
  imports: [
    MongooseSchemesModule,
    NodemailerModule,
    JwtModule,
    ThrottlerModule.forRoot({ ttl: 10, limit: 5 }),
    CqrsModule,
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthRepository,
    AuthJwtAccessTokenStrategy,
    AuthLocalStrategy,
    ...UseCases,
  ],
})
export class AuthModule {}
