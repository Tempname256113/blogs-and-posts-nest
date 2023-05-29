import { Module } from '@nestjs/common';
import { UserController } from '../../admin-api/user/api/user.controller';
import { UserRepository } from '../../admin-api/user/infrastructure/repositories/user.repository';
import { UserQueryRepository } from '../../admin-api/user/infrastructure/repositories/user.query-repository';
import { AuthBasicStrategy } from '../../../libs/auth/passport-strategy/auth-basic.strategy';
import { EnvConfiguration } from '../../../app-configuration/environment/env-configuration';
import { MongooseSchemesModule } from '../../../libs/db/mongoose/mongoose.schemes-module';
import { JwtModule } from '../../../libs/auth/jwt/jwt.module';
import { CreateUserUseCase } from '../../admin-api/user/application/use-cases/create-user.use-case';
import { DeleteUserByIdCommand } from '../../admin-api/user/application/use-cases/delete-user-by-id.use-case';
import { CqrsModule } from '@nestjs/cqrs';

const UseCases = [CreateUserUseCase, DeleteUserByIdCommand];

@Module({
  imports: [MongooseSchemesModule, JwtModule, CqrsModule],
  controllers: [UserController],
  providers: [
    UserRepository,
    UserQueryRepository,
    AuthBasicStrategy,
    EnvConfiguration,
    ...UseCases,
  ],
  exports: [UserRepository, UserQueryRepository],
})
export class UserModule {}
