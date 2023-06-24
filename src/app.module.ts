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
import { TypeOrmModule } from '@nestjs/typeorm';

const ProductModules = [PostModule, BlogModule];

const AuthModules = [AuthModule, SecurityModule];

const envVariables: EnvConfiguration = new EnvConfiguration();

const postgresLocal = {
  host: envVariables.POSTGRES_LOCAL_HOST,
  port: Number(envVariables.POSTGRES_LOCAL_PORT),
  username: envVariables.POSTGRES_LOCAL_USERNAME,
  password: envVariables.POSTGRES_LOCAL_PASSWORD,
};

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async () => {
        const mongoMemoryServer = await MongoMemoryServer.create();
        const mongoMemoryServerConnectionString: string =
          mongoMemoryServer.getUri();
        const mongoLocalConnectionString: string = envVariables.MONGO_LOCAL;
        const mongoServerConnectionString: string = envVariables.MONGO_URL;
        return {
          uri: mongoServerConnectionString,
        };
      },
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: postgresLocal.host,
      port: postgresLocal.port,
      username: postgresLocal.username,
      password: postgresLocal.password,
      database: 'incubator',
      autoLoadEntities: false,
      synchronize: false,
    }),
    MongooseSchemesModule,
    ...ProductModules,
    ...AuthModules,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
