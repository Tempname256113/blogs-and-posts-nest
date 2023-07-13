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
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

const ProductModules = [PostModule, BlogModule];

const AuthModules = [AuthModule, SecurityModule];

const envVariables: EnvConfiguration = new EnvConfiguration();

const postgresLocal: TypeOrmModuleOptions = {
  type: 'postgres',
  host: envVariables.POSTGRES_LOCAL_HOST,
  port: Number(envVariables.POSTGRES_LOCAL_PORT),
  username: envVariables.POSTGRES_LOCAL_USERNAME,
  password: envVariables.POSTGRES_LOCAL_PASSWORD,
  database: 'incubator',
  autoLoadEntities: false,
  synchronize: false,
};

const postgresRemote: TypeOrmModuleOptions = {
  type: 'postgres',
  host: envVariables.POSTGRES_REMOTE_HOST,
  port: Number(envVariables.POSTGRES_REMOTE_PORT),
  username: envVariables.POSTGRES_REMOTE_USERNAME,
  password: envVariables.POSTGRES_REMOTE_PASSWORD,
  database: 'incubator',
  autoLoadEntities: false,
  synchronize: false,
  ssl: true,
};

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async () => {
        const mongoMemoryServer = await MongoMemoryServer.create();
        const mongoMemoryServerConnectionString: string =
          mongoMemoryServer.getUri();
        const mongoLocalConnectionString: string = envVariables.MONGO_LOCAL;
        const mongoRemoteConnectionString: string = envVariables.MONGO_URL;
        return {
          uri: mongoRemoteConnectionString,
        };
      },
    }),
    TypeOrmModule.forRoot(postgresLocal),
    MongooseSchemesModule,
    ...ProductModules,
    ...AuthModules,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
