import { Module } from '@nestjs/common';
import { BlogController } from './blog-api/blog-api-controllers/blog.controller';
import { BlogService } from './blog-application/blog.service';
import { BlogRepository } from './blog-infrastructure/blog-repositories/blog.repository';
import { BlogQueryRepository } from './blog-infrastructure/blog-repositories/blog.query-repository';
import { MongooseSchemesModule } from '../../../libs/db/mongoose/mongoose.schemes-module';
import { LikeModule } from '../like/like.module';
import { JwtModule } from '../../../libs/auth/jwt/jwt.module';
import { CreateBlogUseCase } from './blog-application/blog-application-use-cases/create-blog.use-case';
import { CreatePostBlogUseCase } from './blog-application/blog-application-use-cases/create-post.use-case';
import { UpdateBlogUseCase } from './blog-application/blog-application-use-cases/update-blog.use-case';
import { DeleteBlogCommand } from './blog-application/blog-application-use-cases/delete-blog.use-case';
import { CqrsModule } from '@nestjs/cqrs';

const UseCases = [
  CreateBlogUseCase,
  CreatePostBlogUseCase,
  UpdateBlogUseCase,
  DeleteBlogCommand,
];

@Module({
  imports: [MongooseSchemesModule, LikeModule, JwtModule, CqrsModule],
  controllers: [BlogController],
  providers: [BlogService, BlogRepository, BlogQueryRepository, ...UseCases],
})
export class BlogModule {}
