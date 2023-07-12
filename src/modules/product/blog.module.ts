import { Module } from '@nestjs/common';
import { PublicBlogQueryRepository } from '../../public-api/blog/infrastructure/repositories/blog-public.query-repository';
import { MongooseSchemesModule } from '../../../libs/db/mongoose/mongoose.schemes-module';
import { LikeModule } from './like.module';
import { JwtModule } from '../../../libs/auth/jwt/jwt.module';
import { CqrsModule } from '@nestjs/cqrs';
import { BlogPublicController } from '../../public-api/blog/api/blog-public.controller';
import { BlogBloggerController } from '../../blogger-api/blog/api/blog-blogger.controller';
import { BloggerBlogQueryRepository } from '../../blogger-api/blog/infrastructure/repositories/blog-blogger.query-repository';
import { CreateBlogUseCase } from '../../blogger-api/blog/application/use-cases/create-blog.use-case';
import { BloggerBlogRepository } from '../../blogger-api/blog/infrastructure/repositories/blog-blogger.repository';
import { CreatePostByBlogUseCase } from '../../blogger-api/blog/application/use-cases/create-post-by-blog.use-case';
import { UpdateBlogUseCase } from '../../blogger-api/blog/application/use-cases/update-blog.use-case';
import { UpdatePostByBlogIdUseCase } from '../../blogger-api/blog/application/use-cases/update-post-by-blogId.use-case';
import { DeletePostByBlogIdUseCase } from '../../blogger-api/blog/application/use-cases/delete-post-by-blogId.use-case';
import { BlogAdminController } from '../../admin-api/blog/api/blog-admin.controller';
import { AdminBlogQueryRepository } from '../../admin-api/blog/infrastructure/repositories/blog-admin.query-repository';
import { BindBlogWithUserUseCase } from '../../admin-api/blog/application/use-cases/bind-blog-with-user.use-case';
import { DeleteBlogUseCase } from '../../blogger-api/blog/application/use-cases/delete-blog.use-case';
import { AccessTokenGuard } from '../../../generic-guards/access-token.guard';
import { IsValidBlogIdConstraint } from '../../../libs/validation/class-validator/is-valid-blogid.validation-decorator';
import { BanUserBloggerApiUseCase } from '../../blogger-api/blog/application/use-cases/ban-user.blogger-api.use-case';
import { BanUnbanBlogUseCase } from '../../admin-api/blog/application/use-cases/ban-unban-blog.use-case';
import { BloggerPostRepositorySQL } from '../../blogger-api/blog/infrastructure/repositories/post-blogger.repository-sql';
import { BloggerBlogRepositorySql } from '../../blogger-api/blog/infrastructure/repositories/blog-blogger.repository-sql';
import { BloggerBlogQueryRepositorySQL } from '../../blogger-api/blog/infrastructure/repositories/blog-blogger.query-repository-sql';
import { BloggerPostQueryRepositorySQL } from '../../blogger-api/blog/infrastructure/repositories/post-blogger.query-repository-sql';
import { BloggerUserRepositorySQL } from '../../blogger-api/blog/infrastructure/repositories/user-blogger.repository-sql';
import { BloggerUserQueryRepositorySQL } from '../../blogger-api/blog/infrastructure/repositories/user-blogger.query-repository-sql';
import { PublicBlogQueryRepositorySQL } from '../../public-api/blog/infrastructure/repositories/blog-public.query-repository-sql';
import { PublicPostQueryRepositorySQL } from '../../public-api/post/infrastructure/repositories/post-public.query-repository-sql';
import { AdminBlogQueryRepositorySQL } from '../../admin-api/blog/infrastructure/repositories/blog-admin.query-repository-sql';

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

const blogsBloggerApiRepositories = [
  BloggerBlogRepository,
  BloggerBlogRepositorySql,
  BloggerBlogQueryRepositorySQL,
  BloggerBlogQueryRepository,
];

const postsBloggerApiRepositories = [
  BloggerPostRepositorySQL,
  BloggerPostQueryRepositorySQL,
];

const usersBloggerApiRepositories = [
  BloggerUserRepositorySQL,
  BloggerUserQueryRepositorySQL,
];

const blogsPublicApiRepositories = [
  PublicBlogQueryRepository,
  PublicBlogQueryRepositorySQL,
];

const postsPublicApiRepositories = [PublicPostQueryRepositorySQL];

const blogsAdminApiRepositories = [
  AdminBlogQueryRepository,
  AdminBlogQueryRepositorySQL,
];

@Module({
  imports: [MongooseSchemesModule, LikeModule, JwtModule, CqrsModule],
  controllers: [
    BlogPublicController,
    BlogBloggerController,
    BlogAdminController,
  ],
  providers: [
    ...blogsBloggerApiRepositories,
    ...blogsPublicApiRepositories,
    ...blogsAdminApiRepositories,
    ...postsBloggerApiRepositories,
    ...postsPublicApiRepositories,
    ...usersBloggerApiRepositories,
    ...UseCases,
    AccessTokenGuard,
    IsValidBlogIdConstraint,
  ],
})
export class BlogModule {}
