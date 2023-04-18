import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { envVariables } from './config/env-variables';
import { ProductModule } from './product-module/product.module';
import {
  postSchema,
  PostSchema,
} from './product-module/product-domain/post/post.entity';
import {
  blogSchema,
  BlogSchema,
} from './product-module/product-domain/blog/blog.entity';
import { AuthModule } from './auth-module/auth.module';

@Module({
  imports: [
    MongooseModule.forRoot(envVariables.MONGO_LOCAL),
    ProductModule,
    AuthModule,
    MongooseModule.forFeature([
      { name: PostSchema.name, schema: postSchema },
      { name: BlogSchema.name, schema: blogSchema },
    ]),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
