import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogModule } from './ProductModule/blog/blog.module';
import { envVariables } from './config/app.env-variables';

@Module({
  imports: [MongooseModule.forRoot(envVariables.MONGO_LOCAL), BlogModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
