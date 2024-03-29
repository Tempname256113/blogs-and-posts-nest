import { Module } from '@nestjs/common';
import { UserModule } from './user.module';
import { AuthController } from '../../public-api/auth/api/auth.controller';
import { NodemailerModule } from '../../../libs/email/nodemailer/nodemailer.module';
import { AuthLocalStrategy } from '../../../libs/auth/passport-strategy/auth-local.strategy';
import { MongooseSchemesModule } from '../../../libs/db/mongoose/mongoose.schemes-module';
import { JwtModule } from '../../../libs/auth/jwt/jwt.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { RegistrationUserUseCase } from '../../public-api/auth/application/use-cases/registration-user.use-case';
import { CqrsModule } from '@nestjs/cqrs';
import { ValidateUserUseCase } from '../../public-api/auth/application/use-cases/validate-user.use-case';
import { LoginUserUseCase } from '../../public-api/auth/application/use-cases/login-user.use-case';
import { RegistrationConfirmUseCase } from '../../public-api/auth/application/use-cases/registration-confirm.use-case';
import { ResendConfirmationEmailUseCase } from '../../public-api/auth/application/use-cases/resend-confirmation-email.use-case';
import { UpdateTokensPairUseCase } from '../../public-api/auth/application/use-cases/update-tokens-pair.use-case';
import { SendPasswordRecoveryCodeUseCase } from '../../public-api/auth/application/use-cases/send-password-recovery-code.use-case';
import { SetNewPasswordUseCase } from '../../public-api/auth/application/use-cases/set-new-password.use-case';
import { AuthRepositorySQL } from '../../public-api/auth/infrastructure/repositories/auth.repository-sql';
import { AuthJwtRefreshTokenStrategy } from '../../../libs/auth/passport-strategy/auth-jwt-refresh-token.strategy';
import { AuthQueryRepositorySQL } from '../../public-api/auth/infrastructure/repositories/auth.query-repository-sql';
import { LogoutUserUseCase } from '../../public-api/auth/application/use-cases/logout-user.use-case';
import { TypeormEntitiesModule } from '../../../libs/db/typeorm-sql/typeorm.entities-module';

const UseCases = [
  RegistrationUserUseCase,
  ValidateUserUseCase,
  LoginUserUseCase,
  LogoutUserUseCase,
  RegistrationConfirmUseCase,
  ResendConfirmationEmailUseCase,
  UpdateTokensPairUseCase,
  SendPasswordRecoveryCodeUseCase,
  SetNewPasswordUseCase,
];

@Module({
  imports: [
    MongooseSchemesModule,
    TypeormEntitiesModule,
    NodemailerModule,
    JwtModule,
    ThrottlerModule.forRoot({ ttl: 10, limit: 5 }),
    CqrsModule,
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthRepositorySQL,
    AuthQueryRepositorySQL,
    AuthJwtRefreshTokenStrategy,
    AuthLocalStrategy,
    ...UseCases,
  ],
})
export class AuthModule {}
