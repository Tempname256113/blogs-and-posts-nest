import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { AppController } from './app.controller';
import { EnvConfiguration } from '../app-configuration/environment/env-configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { MongooseSchemesModule } from '../libs/db/mongoose/mongoose.schemes-module';
import { SecurityModule } from './modules/auth/security.module';
import { PostModule } from './modules/product/post.module';
import { BlogModule } from './product-module/blog/blog.module';

const ProductModules = [PostModule, BlogModule];

const AuthModules = [AuthModule, SecurityModule];

@Module({
  imports: [
    MongooseModule.forRoot(new EnvConfiguration().MONGO_URL),
    MongooseSchemesModule,
    ...ProductModules,
    ...AuthModules,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
