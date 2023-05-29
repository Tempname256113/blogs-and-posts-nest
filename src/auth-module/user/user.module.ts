import { Module } from '@nestjs/common';
import { UserController } from './user-api/user-api-controllers/user.controller';
import { UserService } from './user-application/user.service';
import { UserRepository } from './user-infrastructure/user-repositories/user.repository';
import { UserQueryRepository } from './user-infrastructure/user-repositories/user.query-repository';
import { AuthBasicStrategy } from '../../../libs/auth/passport-strategy/auth-basic.strategy';
import { EnvConfiguration } from '../../../app-configuration/environment/env-configuration';
import { MongooseSchemesModule } from '../../../libs/db/mongoose/mongoose.schemes-module';
import { JwtModule } from '../../../libs/auth/jwt/jwt.module';
import { CreateUserUseCase } from './user-application/user-application-use-cases/create-user.use-case';
import { DeleteUserByIdCommand } from './user-application/user-application-use-cases/delete-user-by-id.use-case';
import { CqrsModule } from '@nestjs/cqrs';

const UseCases = [CreateUserUseCase, DeleteUserByIdCommand];

@Module({
  imports: [MongooseSchemesModule, JwtModule, CqrsModule],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    UserQueryRepository,
    AuthBasicStrategy,
    EnvConfiguration,
    ...UseCases,
  ],
})
export class UserModule {}
