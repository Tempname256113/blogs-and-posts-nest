import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthController } from './auth/auth-api/auth.controller';
import { AuthService } from './auth/auth-application/auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { userSchema, UserSchema } from './auth-module-domain/user/user.entity';
import { AuthEmailAdapterModule } from './auth/auth-infrastructure/auth-adapters/auth.email-adapter.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserSchema.name, schema: userSchema }]),
    UserModule,
    AuthEmailAdapterModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
