import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PostApiPaginationQueryDTO } from '../../api/models/post-api.query-dto';
import {
  PostPaginationViewModel,
  PostViewModel,
} from '../../api/models/post-api.models';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { PublicBlogQueryRepositorySQL } from '../../../blog/infrastructure/repositories/blog-public.query-repository-sql';
import { BlogPublicApiViewModel } from '../../../blog/api/models/blog-public-api.models';

@Injectable()
export class PublicPostQueryRepositorySQL {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly jwtUtils: JwtUtils,
    private readonly blogQueryRepositorySQL: PublicBlogQueryRepositorySQL,
  ) {}

  async getPostById({
    postId,
    accessToken,
  }: {
    postId: string;
    accessToken: string | null;
  }): Promise<PostViewModel | null> {
    const getUserId = (): string | null => {
      if (!accessToken) {
        return null;
      } else {
        const accessTokenPayload: JwtAccessTokenPayloadType | null =
          this.jwtUtils.verifyAccessToken(accessToken);
        if (!accessToken) {
          return null;
        } else {
          return accessTokenPayload.userId;
        }
      }
    };
    const userId: string = getUserId();
    const rawFoundedPost: any[] = await this.dataSource.query(
      `
    SELECT p."id", p."title", p."short_description", p."content", p."created_at", p."blog_id",
    b."name" as "blog_name"
    FROM public.posts p
    JOIN public.blogs b on p."blog_id" = b."id"
    WHERE p."id" = $1 AND p."hidden" = false
    `,
      [postId],
    );
    if (rawFoundedPost.length < 1) throw new NotFoundException();
    const foundedPost: any = rawFoundedPost[0];
    const postToClient: PostViewModel = {
      id: String(foundedPost.id),
      title: foundedPost.title,
      shortDescription: foundedPost.short_description,
      content: foundedPost.content,
      blogId: String(foundedPost.blog_id),
      blogName: foundedPost.blog_name,
      createdAt: foundedPost.created_at,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      },
    };
    return postToClient;
  }

  async getPostsWithPaginationByBlogId({
    paginationQuery,
    blogId,
    accessToken,
  }: {
    paginationQuery: PostApiPaginationQueryDTO;
    blogId: string;
    accessToken: string | null;
  }): Promise<PostPaginationViewModel> {
    const getUserId = (): string | null => {
      if (!accessToken) {
        return null;
      } else {
        const accessTokenPayload: JwtAccessTokenPayloadType | null =
          this.jwtUtils.verifyAccessToken(accessToken);
        if (!accessToken) {
          return null;
        } else {
          return accessTokenPayload.userId;
        }
      }
    };
    const userId: string | null = getUserId();
    const foundedBlog: BlogPublicApiViewModel | null =
      await this.blogQueryRepositorySQL.getBlogById(blogId);
    if (!foundedBlog) throw new NotFoundException();
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
    WHERE p."blog_id" = $1 AND p."hidden" = false
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
    WHERE p."blog_id" = $1 AND p."hidden" = false
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

  async getPostsWithPagination({
    paginationQuery,
    accessToken,
  }: {
    paginationQuery: PostApiPaginationQueryDTO;
    accessToken: string | null;
  }): Promise<PostPaginationViewModel> {
    const getUserId = (): string | null => {
      if (!accessToken) {
        return null;
      } else {
        const accessTokenPayload: JwtAccessTokenPayloadType | null =
          this.jwtUtils.verifyAccessToken(accessToken);
        if (!accessToken) {
          return null;
        } else {
          return accessTokenPayload.userId;
        }
      }
    };
    const userId: string | null = getUserId();
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
    const filter = 'p."hidden" = false';
    const postsCount: [{ count: number }] = await this.dataSource.query(
      `
    SELECT COUNT(*)
    FROM public.posts p
    WHERE ${filter}
    `,
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
    WHERE ${filter}
    ORDER BY ${orderBy} ${paginationQuery.sortDirection.toUpperCase()}
    LIMIT ${paginationQuery.pageSize} OFFSET ${howMuchToSkip}
    `,
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
}
