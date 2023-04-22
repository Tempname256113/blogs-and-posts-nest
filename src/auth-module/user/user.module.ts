import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { userSchema, UserSchema } from '../auth-domain/user/user.entity';
import { UserController } from './user-api/user-api-controllers/user.controller';
import { UserService } from './user-application/user.service';
import { UserRepository } from './user-infrastructure/user-repositories/user.repository';
import { UserQueryRepository } from './user-infrastructure/user-repositories/user.query-repository';
import { BasicStrategy } from '../../app-configuration/passport-strategy/auth-basic.strategy';
import { EnvConfiguration } from '../../app-configuration/env-configuration';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserSchema.name, schema: userSchema }]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    UserQueryRepository,
    BasicStrategy,
    EnvConfiguration,
  ],
})
export class UserModule {}
