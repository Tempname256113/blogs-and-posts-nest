import { Module } from '@nestjs/common';
import { ProductModule } from './product-module/product.module';
import { AuthModule } from './auth-module/auth.module';
import { AppController } from './app.controller';
import { EnvConfiguration } from './app-configuration/environment/env-configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { MongooseSchemesModule } from './app-configuration/db/mongoose.schemes-module';

@Module({
  imports: [
    MongooseModule.forRoot(new EnvConfiguration().MONGO_URL),
    MongooseSchemesModule,
    ProductModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
