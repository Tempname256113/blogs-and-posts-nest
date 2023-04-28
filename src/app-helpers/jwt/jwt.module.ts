import { Module } from '@nestjs/common';
import { EnvConfiguration } from '../../app-configuration/environment/env-configuration';
import { JwtHelpers } from './jwt-helpers.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  providers: [EnvConfiguration, JwtService, JwtHelpers],
  exports: [JwtHelpers],
})
export class JwtModule {}
