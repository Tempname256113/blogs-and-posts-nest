import { Module } from '@nestjs/common';
import { BlogPublicQueryRepository } from '../../public-api/blog/infrastructure/repositories/blog-public.query-repository';
import { MongooseSchemesModule } from '../../../libs/db/mongoose/mongoose.schemes-module';
import { LikeModule } from './like.module';
import { JwtModule } from '../../../libs/auth/jwt/jwt.module';
import { CqrsModule } from '@nestjs/cqrs';
import { BlogPublicController } from '../../public-api/blog/api/blog-public.controller';
import { BlogBloggerController } from '../../blogger-api/blog/api/blog-blogger.controller';
import { BlogBloggerQueryRepository } from '../../blogger-api/blog/infrastructure/repositories/blog-blogger.query-repository';
import { CreateBlogUseCase } from '../../blogger-api/blog/application/use-cases/create-blog.use-case';
import { BlogRepository } from '../../blogger-api/blog/infrastructure/repositories/blog.repository';
import { CreatePostByBlogUseCase } from '../../blogger-api/blog/application/use-cases/create-post-by-blog.use-case';
import { UpdateBlogUseCase } from '../../blogger-api/blog/application/use-cases/update-blog.use-case';
import { UpdatePostByBlogIdUseCase } from '../../blogger-api/blog/application/use-cases/update-post-by-blogId.use-case';
import { DeletePostByBlogIdUseCase } from '../../blogger-api/blog/application/use-cases/delete-post-by-blogId.use-case';
import { BlogAdminController } from '../../admin-api/blog/api/blog-admin.controller';
import { BlogAdminQueryRepository } from '../../admin-api/blog/infrastructure/repositories/blog-admin.query-repository';
import { BindBlogWithUserUseCase } from '../../admin-api/blog/application/use-cases/bind-blog-with-user.use-case';
import { DeleteBlogCommand } from '../../blogger-api/blog/application/use-cases/delete-blog.use-case';

const UseCases = [
  CreateBlogUseCase,
  CreatePostByBlogUseCase,
  UpdateBlogUseCase,
  DeleteBlogCommand,
  UpdatePostByBlogIdUseCase,
  DeletePostByBlogIdUseCase,
  BindBlogWithUserUseCase,
];

@Module({
  imports: [MongooseSchemesModule, LikeModule, JwtModule, CqrsModule],
  controllers: [
    BlogPublicController,
    BlogBloggerController,
    BlogAdminController,
  ],
  providers: [
    BlogRepository,
    BlogPublicQueryRepository,
    BlogBloggerQueryRepository,
    BlogAdminQueryRepository,
    ...UseCases,
  ],
})
export class BlogModule {}
