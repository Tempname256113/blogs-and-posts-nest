import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { envVariables } from './config/env-variables';
import { ProductModule } from './product-module/product.module';
import {
  postSchema,
  PostSchema,
} from './product-module/post/post-api/post-application/post-domain/post.entity';
import {
  blogSchema,
  BlogSchema,
} from './product-module/blog/blog-application/blog-domain/blog.entity';

@Module({
  imports: [
    MongooseModule.forRoot(envVariables.MONGO_LOCAL),
    ProductModule,
    MongooseModule.forFeature([
      { name: PostSchema.name, schema: postSchema },
      { name: BlogSchema.name, schema: blogSchema },
    ]),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
