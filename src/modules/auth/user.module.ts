import { Module } from '@nestjs/common';
import { UserAdminController } from '../../admin-api/user/api/user-admin.controller';
import { AuthBasicStrategy } from '../../../libs/auth/passport-strategy/auth-basic.strategy';
import { EnvConfiguration } from '../../../app-configuration/environment/env-configuration';
import { MongooseSchemesModule } from '../../../libs/db/mongoose/mongoose.schemes-module';
import { JwtModule } from '../../../libs/auth/jwt/jwt.module';
import { CreateUserUseCase } from '../../admin-api/user/application/use-cases/create-user.use-case';
import { DeleteUserByIdUseCase } from '../../admin-api/user/application/use-cases/delete-user-by-id.use-case';
import { CqrsModule } from '@nestjs/cqrs';
import { BanUnbanUserUseCase } from '../../admin-api/user/application/use-cases/ban-unban-user.use-case';
import { UserQueryRepositorySQL } from '../../admin-api/user/infrastructure/repositories/user.query-repository-sql';
import { UserRepositorySQL } from '../../admin-api/user/infrastructure/repositories/user.repository-sql';
import { SecurityRepositorySQL } from '../../public-api/security/infrastructure/repositories/security.repository-sql';
import { TypeormEntitiesModule } from '../../../libs/db/typeorm-sql/typeorm.entities-module';

const UseCases = [
  CreateUserUseCase,
  DeleteUserByIdUseCase,
  BanUnbanUserUseCase,
];

@Module({
  imports: [
    MongooseSchemesModule,
    JwtModule,
    CqrsModule,
    TypeormEntitiesModule,
  ],
  controllers: [UserAdminController],
  providers: [
    UserRepositorySQL,
    SecurityRepositorySQL,
    UserQueryRepositorySQL,
    AuthBasicStrategy,
    EnvConfiguration,
    ...UseCases,
  ],
  exports: [UserRepositorySQL, UserQueryRepositorySQL],
})
export class UserModule {}
