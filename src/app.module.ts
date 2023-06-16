import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { AppController } from './app.controller';
import { EnvConfiguration } from '../app-configuration/environment/env-configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { MongooseSchemesModule } from '../libs/db/mongoose/mongoose.schemes-module';
import { SecurityModule } from './modules/auth/security.module';
import { PostModule } from './modules/product/post.module';
import { BlogModule } from './modules/product/blog.module';
import { MongoMemoryServer } from 'mongodb-memory-server';

const ProductModules = [PostModule, BlogModule];

const AuthModules = [AuthModule, SecurityModule];

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async () => {
        const mongoMemoryServer = await MongoMemoryServer.create();
        const mongoMemoryServerConnectionString: string =
          mongoMemoryServer.getUri();
        const mongoLocalConnectionString: string = new EnvConfiguration()
          .MONGO_LOCAL;
        const mongoServerConnectionString: string = new EnvConfiguration()
          .MONGO_URL;
        return {
          uri: mongoServerConnectionString,
        };
      },
    }),
    MongooseSchemesModule,
    ...ProductModules,
    ...AuthModules,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
