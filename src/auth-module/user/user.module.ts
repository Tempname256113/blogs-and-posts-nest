import { Module } from '@nestjs/common';
import { UserController } from './user-api/user-api-controllers/user.controller';
import { UserService } from './user-application/user.service';
import { UserRepository } from './user-infrastructure/user-repositories/user.repository';
import { UserQueryRepository } from './user-infrastructure/user-repositories/user.query-repository';
import { AuthBasicStrategy } from '../../app-helpers/passport-strategy/auth-basic.strategy';
import { EnvConfiguration } from '../../app-configuration/environment/env-configuration';
import { MongooseSchemesModule } from '../../app-configuration/db/mongoose.schemes-module';

@Module({
  imports: [MongooseSchemesModule],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    UserQueryRepository,
    AuthBasicStrategy,
    EnvConfiguration,
  ],
})
export class UserModule {}
