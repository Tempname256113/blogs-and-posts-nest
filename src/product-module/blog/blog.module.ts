import { Module } from '@nestjs/common';
import { BlogController } from './blog-api/blog-api-controllers/blog.controller';
import { BlogService } from './blog-application/blog.service';
import { BlogRepository } from './blog-infrastructure/blog-repositories/blog.repository';
import { BlogQueryRepository } from './blog-infrastructure/blog-repositories/blog.query-repository';
import { MongooseSchemesModule } from '../../../libs/db/mongoose/mongoose.schemes-module';
import { LikeModule } from '../like/like.module';
import { JwtModule } from '../../../libs/auth/jwt/jwt.module';

@Module({
  imports: [MongooseSchemesModule, LikeModule, JwtModule],
  controllers: [BlogController],
  providers: [BlogService, BlogRepository, BlogQueryRepository],
})
export class BlogModule {}
