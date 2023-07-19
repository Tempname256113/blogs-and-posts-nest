import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  PostNewestLikeType,
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

  async getPostByIdInternalUse(
    postId: string,
  ): Promise<BloggerRepositoryPostType | null> {
    if (!Number(postId)) {
      return null;
    }
    const result: any[] = await this.dataSource.query(
      `
    SELECT *
    FROM public.posts p
    WHERE p."id" = $1 AND p."hidden" = false
    `,
      [postId],
    );
    if (result.length < 1) return null;
    const res: any = result[0];
    return {
      id: String(res.id),
      blogId: String(res.blog_id),
      title: res.title,
      shortDescription: res.short_description,
      content: res.content,
      createdAt: res.created_at,
      hidden: res.hidden,
    };
  }

  async getPostsWithPaginationByBlogId({
    blogId,
    paginationQuery,
    accessToken,
  }: {
    accessToken: string;
    paginationQuery: PostApiPaginationQueryDTO;
    blogId: string;
  }): Promise<PostPaginationViewModel> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const bloggerId: string = accessTokenPayload.userId;
    let currentUserReactionQuery: string;
    if (bloggerId) {
      currentUserReactionQuery = `(
      SELECT pl."like_status"
      FROM public.posts_likes pl
      WHERE pl."post_id" = p."id" AND pl."user_id" = $1 AND pl."hidden" = false)
      as "current_user_reaction"`;
    } else {
      currentUserReactionQuery = `(SELECT null) as "current_user_reaction"`;
    }
    const checkBlogOwner = async (): Promise<void> => {
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
    const rawFoundedPosts: any[] = await this.dataSource.query(
      `
    SELECT p."id", p."title", p."short_description", p."content", p."created_at", p."blog_id",
    b."name" as "blog_name"
    ${currentUserReactionQuery}
    (SELECT COUNT(*) FROM public.posts_likes pl2
     WHERE pl2."post_id" = p."id" AND pl2."like_status" = true AND pl2."hidden" = false) as "likes_count",
    (SELECT COUNT(*) FROM public.posts_likes pl3
     WHERE pl3."post_id" = p."id" AND pl3."like_status" = false AND pl3."hidden" = false) as "dislikes_count"
    FROM public.posts p
    JOIN public.blogs b on p."blog_id" = b."id"
    WHERE p."blog_id" = $1 AND p."hidden" = false
    ORDER BY ${orderBy} ${paginationQuery.sortDirection.toUpperCase()}
    LIMIT ${paginationQuery.pageSize} OFFSET ${howMuchToSkip}
    `,
      [blogId],
    );
    const mappedPosts: PostViewModel[] = [];
    for (const rawPost of rawFoundedPosts) {
      let myStatus: 'Like' | 'Dislike' | 'None';
      switch (rawPost.current_user_reaction) {
        case true:
          myStatus = 'Like';
          break;
        case false:
          myStatus = 'Dislike';
          break;
        case null:
          myStatus = 'None';
          break;
      }
      const rawNewestLikes: any[] = await this.dataSource.query(
        `
        SELECT pl."added_at", pl."user_id", u."login"
        FROM public.posts_likes pl
        JOIN public.users u ON u."id" = pl."user_id"
        WHERE pl."post_id" = $1 AND pl."hidden" = false AND pl."like_status" = true
        ORDER BY pl."added_at" DESC
        LIMIT 3 OFFSET 0
        `,
        [rawPost.id],
      );
      const mappedNewestLikes: PostNewestLikeType[] = rawNewestLikes.map(
        (rawNewestLike) => {
          const mappedNewestLike: PostNewestLikeType = {
            addedAt: rawNewestLike.added_at,
            userId: String(rawNewestLike.user_id),
            login: rawNewestLike.login,
          };
          return mappedNewestLike;
        },
      );
      const mappedPost: PostViewModel = {
        id: String(rawPost.id),
        title: rawPost.title,
        shortDescription: rawPost.short_description,
        content: rawPost.content,
        blogId: String(rawPost.blog_id),
        blogName: rawPost.blog_name,
        createdAt: rawPost.created_at,
        extendedLikesInfo: {
          likesCount: rawPost.likes_count,
          dislikesCount: rawPost.dislikes_count,
          myStatus,
          newestLikes: mappedNewestLikes,
        },
      };
      mappedPosts.push(mappedPost);
    }
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
