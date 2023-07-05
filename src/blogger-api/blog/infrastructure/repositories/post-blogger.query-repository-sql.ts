import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  PostPaginationViewModel,
  PostViewModel,
} from '../../../../public-api/post/api/models/post-api.models';
import { PostApiPaginationQueryDTO } from '../../../../public-api/post/api/models/post-api.query-dto';
import { BloggerBlogQueryRepositorySQL } from './blog-blogger.query-repository-sql';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import {
  BloggerRepositoryBlogType,
  BloggerRepositoryPostType,
} from './models/blogger-repository.models';

@Injectable()
export class BloggerPostQueryRepositorySQL {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly blogQueryRepositorySQL: BloggerBlogQueryRepositorySQL,
    private readonly jwtUtils: JwtUtils,
  ) {}

  async getPostsWithPaginationByBlogId({
    blogId,
    paginationQuery,
    accessToken,
  }: {
    accessToken: string;
    paginationQuery: PostApiPaginationQueryDTO;
    blogId: string;
  }): Promise<PostPaginationViewModel> {
    const checkBlogOwner = async (): Promise<void> => {
      const accessTokenPayload: JwtAccessTokenPayloadType | null =
        this.jwtUtils.verifyAccessToken(accessToken);
      if (!accessTokenPayload) throw new UnauthorizedException();
      const bloggerId: string = accessTokenPayload.userId;
      const foundedBlogById: BloggerRepositoryBlogType | null =
        await this.blogQueryRepositorySQL.getBlogByIdInternalUse(blogId);
      if (!foundedBlogById) throw new NotFoundException();
      if (bloggerId !== foundedBlogById.bloggerId) {
        throw new ForbiddenException();
      }
    };
    await checkBlogOwner();
    let orderBy: string;
    const getCorrectOrderBy = (): void => {
      switch (paginationQuery.sortBy) {
        case 'createdAt':
          orderBy = 'p."created_at"';
          break;
        case 'title':
          orderBy = 'p."title"';
          break;
      }
    };
    getCorrectOrderBy();
    const postsCount: [{ count: number }] = await this.dataSource.query(
      `
    SELECT COUNT(*)
    FROM public.posts p
    WHERE p."blog_id" = $1
    `,
      [blogId],
    );
    const totalPostsCount: number = postsCount[0].count;
    const howMuchToSkip: number =
      paginationQuery.pageSize * (paginationQuery.pageNumber - 1);
    const pagesCount: number = Math.ceil(
      totalPostsCount / paginationQuery.pageSize,
    );
    const foundedPosts: any[] = await this.dataSource.query(
      `
    SELECT p."id", p."title", p."short_description", p."content", p."created_at", p."blog_id",
    b."name" as "blog_name"
    FROM public.posts p
    JOIN public.blogs b on p."blog_id" = b."id"
    WHERE p."blog_id" = $1
    ORDER BY ${orderBy} ${paginationQuery.sortDirection.toUpperCase()}
    LIMIT ${paginationQuery.pageSize} OFFSET ${howMuchToSkip}
    `,
      [blogId],
    );
    const mappedPosts: PostViewModel[] = foundedPosts.map((postFromDB) => {
      const mappedPost: PostViewModel = {
        id: String(postFromDB.id),
        title: postFromDB.title,
        shortDescription: postFromDB.short_description,
        content: postFromDB.content,
        blogId: String(postFromDB.blog_id),
        blogName: postFromDB.blog_name,
        createdAt: postFromDB.created_at,
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
          newestLikes: [],
        },
      };
      return mappedPost;
    });
    const paginationPostsResult: PostPaginationViewModel = {
      pagesCount,
      page: Number(paginationQuery.pageNumber),
      pageSize: Number(paginationQuery.pageSize),
      totalCount: Number(totalPostsCount),
      items: mappedPosts,
    };
    return paginationPostsResult;
  }

  async getPostByIdInternalUse(
    postId: string,
  ): Promise<BloggerRepositoryPostType | null> {
    const result: any[] = await this.dataSource.query(
      `
    SELECT *
    FROM public.posts p
    WHERE p."id" = $1
    `,
      [postId],
    );
    if (result.length < 1) return null;
    const res: any = result[0];
    return {
      id: res.id,
      blogId: res.blog_id,
      title: res.title,
      shortDescription: res.short_description,
      content: res.content,
      createdAt: res.created_at,
      hidden: res.hidden,
    };
  }
}
