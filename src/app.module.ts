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
import { TypeormEntitiesModule } from '../libs/db/typeorm-sql/typeorm.entities-module';
import { QuizModule } from './modules/product/quiz.module';

const ProductModules = [PostModule, BlogModule, QuizModule];

const AuthModules = [AuthModule, SecurityModule];

const envVariables: EnvConfiguration = new EnvConfiguration();

const postgresLocal: TypeOrmModuleOptions = {
  type: 'postgres',
  host: envVariables.POSTGRES_LOCAL_HOST,
  port: Number(envVariables.POSTGRES_LOCAL_PORT),
  username: envVariables.POSTGRES_LOCAL_USERNAME,
  password: envVariables.POSTGRES_LOCAL_PASSWORD,
  database: 'incubator',
  autoLoadEntities: true,
  synchronize: true,
};

const postgresRemote: TypeOrmModuleOptions = {
  type: 'postgres',
  host: envVariables.POSTGRES_REMOTE_HOST,
  port: Number(envVariables.POSTGRES_REMOTE_PORT),
  username: envVariables.POSTGRES_REMOTE_USERNAME,
  password: envVariables.POSTGRES_REMOTE_PASSWORD,
  database: 'incubator',
  autoLoadEntities: true,
  synchronize: true,
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
    TypeOrmModule.forRoot(postgresRemote),
    MongooseSchemesModule,
    TypeormEntitiesModule,
    ...ProductModules,
    ...AuthModules,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
