import { Module } from '@nestjs/common';
import { PostController } from '../../public-api/post/api/post.controller';
import { JwtModule } from '../../../libs/auth/jwt/jwt.module';
import { CommentModule } from './comment.module';
import { IsValidBlogIdConstraint } from '../../../libs/validation/class-validator/is-valid-blogid.validation-decorator';
import { CreateNewCommentUseCase } from '../../public-api/post/application/use-cases/create-new-comment.use-case';
import { ChangePostLikeStatusUseCase } from '../../public-api/post/application/use-cases/change-post-like-status.use-case';
import { CqrsModule } from '@nestjs/cqrs';
import { PublicPostQueryRepositorySQL } from '../../public-api/post/infrastructure/repositories/post-public.query-repository-sql';
import { PublicBlogQueryRepositorySQL } from '../../public-api/blog/infrastructure/repositories/blog-public.query-repository-sql';
import { BloggerBlogQueryRepositorySQL } from '../../blogger-api/blog/infrastructure/repositories/blog-blogger.query-repository-sql';
import { UserQueryRepositorySQL } from '../../admin-api/user/infrastructure/repositories/user.query-repository-sql';
import { BloggerUserQueryRepositorySQL } from '../../blogger-api/blog/infrastructure/repositories/user-blogger.query-repository-sql';
import { PublicCommentRepositorySQL } from '../../public-api/comment/infrastructure/repositories/comment-public.repository-sql';
import { PublicCommentQueryRepositorySQL } from '../../public-api/comment/infrastructure/repositories/comment-public.query-repository-sql';
import { PublicPostRepositorySQL } from '../../public-api/post/infrastructure/repositories/post-public.repository-sql';
import { TypeormEntitiesModule } from '../../../libs/db/typeorm-sql/typeorm.entities-module';

const UseCases = [CreateNewCommentUseCase, ChangePostLikeStatusUseCase];

const blogsBloggerApiRepositories = [BloggerBlogQueryRepositorySQL];

const usersBloggerApiRepositories = [BloggerUserQueryRepositorySQL];

const usersAdminApiRepositories = [UserQueryRepositorySQL];

const commentsPublicApiRepositories = [
  PublicCommentRepositorySQL,
  PublicCommentQueryRepositorySQL,
];

const postsPublicApiRepositories = [
  PublicPostRepositorySQL,
  PublicPostQueryRepositorySQL,
];

const blogsPublicApiRepositories = [PublicBlogQueryRepositorySQL];

@Module({
  imports: [TypeormEntitiesModule, JwtModule, CommentModule, CqrsModule],
  controllers: [PostController],
  providers: [
    IsValidBlogIdConstraint,
    ...UseCases,
    ...postsPublicApiRepositories,
    ...blogsPublicApiRepositories,
    ...blogsBloggerApiRepositories,
    ...usersBloggerApiRepositories,
    ...usersAdminApiRepositories,
    ...commentsPublicApiRepositories,
  ],
})
export class PostModule {}
