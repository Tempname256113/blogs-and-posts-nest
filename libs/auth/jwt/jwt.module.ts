import { Module } from '@nestjs/common';
import { EnvConfiguration } from '../../../app-configuration/environment/env-configuration';
import { JwtUtils } from './jwt-utils.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  providers: [EnvConfiguration, JwtService, JwtUtils],
  exports: [JwtUtils],
})
export class JwtModule {}
