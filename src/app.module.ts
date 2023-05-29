import { Module } from '@nestjs/common';
import { ProductModule } from './product-module/product.module';
import { AuthModule } from './public-api/auth/auth.module';
import { AppController } from './app.controller';
import { EnvConfiguration } from '../app-configuration/environment/env-configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { MongooseSchemesModule } from '../libs/db/mongoose/mongoose.schemes-module';
import { SecurityModule } from './public-api/security/security.module';

@Module({
  imports: [
    MongooseModule.forRoot(new EnvConfiguration().MONGO_URL),
    MongooseSchemesModule,
    ProductModule,
    AuthModule,
    SecurityModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
