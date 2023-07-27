import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSQLEntity } from './entities/users/user-sql.entity';
import { UserEmailConfirmInfoSQLEntity } from './entities/users/user-email-confirm-info-sql.entity';
import { UserPasswordRecoveryInfoSQLEntity } from './entities/users/user-password-recovery-info-sql.entity';
import { SessionSQLEntity } from './entities/users/session-sql.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserSQLEntity,
      UserEmailConfirmInfoSQLEntity,
      UserPasswordRecoveryInfoSQLEntity,
      SessionSQLEntity,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class TypeormEntitiesModule {}
