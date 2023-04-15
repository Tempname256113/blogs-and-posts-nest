import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { envVariables } from './config/env-variables';
import { ProductModule } from './product-module/product.module';

@Module({
  imports: [MongooseModule.forRoot(envVariables.MONGO_LOCAL), ProductModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
