import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { appEnvVariables } from './app-env-variables/app-env.variables';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(appEnvVariables.MONGO_LOCAL),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
