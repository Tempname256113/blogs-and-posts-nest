import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { envVariables } from './app-config/env-variables';
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
import { AppController } from './app.controller';
import {
  userSchema,
  UserSchema,
} from './auth-module/auth-domain/user/user.entity';

@Module({
  imports: [
    MongooseModule.forRoot(envVariables.MONGO_URL),
    ProductModule,
    AuthModule,
    MongooseModule.forFeature([
      { name: PostSchema.name, schema: postSchema },
      { name: BlogSchema.name, schema: blogSchema },
      { name: UserSchema.name, schema: userSchema },
    ]),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
