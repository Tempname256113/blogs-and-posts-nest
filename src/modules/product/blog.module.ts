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
import { BloggerBlogRepository } from '../../blogger-api/blog/infrastructure/repositories/blog-blogger.repository';
import { CreatePostByBlogUseCase } from '../../blogger-api/blog/application/use-cases/create-post-by-blog.use-case';
import { UpdateBlogUseCase } from '../../blogger-api/blog/application/use-cases/update-blog.use-case';
import { UpdatePostByBlogIdUseCase } from '../../blogger-api/blog/application/use-cases/update-post-by-blogId.use-case';
import { DeletePostByBlogIdUseCase } from '../../blogger-api/blog/application/use-cases/delete-post-by-blogId.use-case';
import { BlogAdminController } from '../../admin-api/blog/api/blog-admin.controller';
import { BlogAdminQueryRepository } from '../../admin-api/blog/infrastructure/repositories/blog-admin.query-repository';
import { BindBlogWithUserUseCase } from '../../admin-api/blog/application/use-cases/bind-blog-with-user.use-case';
import { DeleteBlogUseCase } from '../../blogger-api/blog/application/use-cases/delete-blog.use-case';
import { AccessTokenGuard } from '../../../generic-guards/access-token.guard';
import { IsValidBlogIdConstraint } from '../../../libs/validation/class-validator/is-valid-blogid.validation-decorator';
import { BanUserBloggerApiUseCase } from '../../blogger-api/blog/application/use-cases/ban-user.blogger-api.use-case';
import { BanUnbanBlogUseCase } from '../../admin-api/blog/application/use-cases/ban-unban-blog.use-case';
import { BloggerPostRepositorySQL } from '../../blogger-api/blog/infrastructure/repositories/post-blogger.repository-sql';
import { BloggerBlogRepositorySql } from '../../blogger-api/blog/infrastructure/repositories/blog-blogger.repository-sql';
import { BloggerBlogQueryRepositorySQL } from '../../blogger-api/blog/infrastructure/repositories/blog-blogger.query-repository-sql';

const UseCases = [
  CreateBlogUseCase,
  CreatePostByBlogUseCase,
  UpdateBlogUseCase,
  DeleteBlogUseCase,
  UpdatePostByBlogIdUseCase,
  DeletePostByBlogIdUseCase,
  BindBlogWithUserUseCase,
  BanUserBloggerApiUseCase,
  BanUnbanBlogUseCase,
];

@Module({
  imports: [MongooseSchemesModule, LikeModule, JwtModule, CqrsModule],
  controllers: [
    BlogPublicController,
    BlogBloggerController,
    BlogAdminController,
  ],
  providers: [
    BloggerBlogRepository,
    BloggerBlogRepositorySql,
    BloggerPostRepositorySQL,
    BlogPublicQueryRepository,
    BloggerBlogQueryRepositorySQL,
    BlogBloggerQueryRepository,
    BlogAdminQueryRepository,
    ...UseCases,
    AccessTokenGuard,
    IsValidBlogIdConstraint,
  ],
})
export class BlogModule {}
