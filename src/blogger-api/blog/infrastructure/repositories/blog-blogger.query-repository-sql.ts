import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BloggerRepositoryBlogType } from './models/blogger-repository.models';
import {
  BlogBloggerApiPaginationQueryDTO,
  CommentBloggerApiPaginationQueryDTO,
} from '../../api/models/blog-blogger-api.query-dto';
import {
  BlogBloggerApiPaginationViewModel,
  BlogBloggerApiViewModel,
  CommentBloggerApiPaginationViewModel,
  CommentBloggerApiViewModel,
} from '../../api/models/blog-blogger-api.models';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { BlogSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/blog-sql.entity';

@Injectable()
export class BloggerBlogQueryRepositorySQL {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(BlogSQLEntity)
    private readonly blogEntity: Repository<BlogSQLEntity>,
    private readonly jwtUtils: JwtUtils,
  ) {}

  async getBlogByIdInternalUse(
    blogId: string,
  ): Promise<BloggerRepositoryBlogType | null> {
    if (!Number(blogId)) {
      return null;
    }
    const foundedBlog: BlogSQLEntity | null = await this.blogEntity.findOneBy({
      id: Number(blogId),
      hidden: false,
    });
    return {
      id: String(foundedBlog.id),
      bloggerId: String(foundedBlog.bloggerId),
      name: foundedBlog.name,
      description: foundedBlog.description,
      websiteUrl: foundedBlog.websiteUrl,
      createdAt: foundedBlog.createdAt,
      isMembership: foundedBlog.isMembership,
      isBanned: foundedBlog.isBanned,
      banDate: foundedBlog.banDate,
      hidden: foundedBlog.hidden,
    };
  }

  async getBlogsWithPaginationForCurrentUser({
    paginationQuery,
    accessToken,
  }: {
    paginationQuery: BlogBloggerApiPaginationQueryDTO;
    accessToken: string;
  }): Promise<BlogBloggerApiPaginationViewModel> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const bloggerId: string = accessTokenPayload.userId;
    const blogsWithPagination =
      async (): Promise<BlogBloggerApiPaginationViewModel> => {
        let filter: string;
        const getCorrectBlogsFilter = (): void => {
          if (paginationQuery.searchNameTerm) {
            filter = `b."name" ILIKE '%${paginationQuery.searchNameTerm}%' AND b."blogger_id" = '${bloggerId}'`;
          } else {
            filter = `b."blogger_id" = '${bloggerId}'`;
          }
        };
        getCorrectBlogsFilter();
        let orderBy: string;
        const getCorrectOrderBy = (): void => {
          switch (paginationQuery.sortBy) {
            case 'createdAt':
              orderBy = 'b."created_at"';
              break;
            case 'name':
              orderBy = 'b."name"';
              break;
            case 'description':
              orderBy = 'b."description';
              break;
          }
        };
        getCorrectOrderBy();
        const blogsCount: [{ count: number }] = await this.dataSource.query(`
        SELECT COUNT(*) 
        FROM public.blogs b
        WHERE ${filter}
        `);
        const totalBlogsCount: number = blogsCount[0].count;
        const howMuchToSkip: number =
          paginationQuery.pageSize * (paginationQuery.pageNumber - 1);
        const pagesCount: number = Math.ceil(
          totalBlogsCount / paginationQuery.pageSize,
        );
        const foundedBlogs: any[] = await this.dataSource.query(`
        SELECT b."id", b."name", b."description", b."website_url", b."created_at", b."is_membership" 
        FROM public.blogs b
        WHERE ${filter}
        ORDER BY ${orderBy} ${paginationQuery.sortDirection.toUpperCase()}
        LIMIT ${paginationQuery.pageSize} OFFSET ${howMuchToSkip}
        `);
        const mappedBlogs: BlogBloggerApiViewModel[] = foundedBlogs.map(
          (blogFromDB) => {
            const mappedBlog: BlogBloggerApiViewModel = {
              id: String(blogFromDB.id),
              name: blogFromDB.name,
              description: blogFromDB.description,
              websiteUrl: blogFromDB.website_url,
              createdAt: blogFromDB.created_at,
              isMembership: blogFromDB.is_membership,
            };
            return mappedBlog;
          },
        );
        const paginationBlogsResult: BlogBloggerApiPaginationViewModel = {
          pagesCount,
          page: Number(paginationQuery.pageNumber),
          pageSize: Number(paginationQuery.pageSize),
          totalCount: Number(totalBlogsCount),
          items: mappedBlogs,
        };
        return paginationBlogsResult;
      };
    return blogsWithPagination();
  }

  async getAllCommentsFromAllPosts({
    paginationQuery,
    accessToken,
  }: {
    paginationQuery: CommentBloggerApiPaginationQueryDTO;
    accessToken: string;
  }): Promise<CommentBloggerApiPaginationViewModel> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const userId: string = accessTokenPayload.userId;
    const notFoundPaginationResult: CommentBloggerApiPaginationViewModel = {
      pagesCount: 0,
      page: Number(paginationQuery.pageNumber),
      pageSize: Number(paginationQuery.pageSize),
      totalCount: 0,
      items: [],
    };
    const rawFoundedBlogs: { blog_id: number }[] = await this.dataSource.query(
      `
    SELECT b."id" as "blog_id"
    FROM public.blogs b
    WHERE b."blogger_id" = $1 AND b."hidden" = false
    `,
      [userId],
    );
    const blogsId: string[] = rawFoundedBlogs.map((rawBlog) => {
      return String(rawBlog.blog_id);
    });
    if (blogsId.length < 1) {
      return notFoundPaginationResult;
    }
    const rawFoundedPosts: {
      post_id: number;
    }[] = await this.dataSource.query(`
    SELECT p."id" as "post_id"
    FROM public.posts p
    WHERE p."blog_id" IN (${blogsId}) AND p."hidden" = false
    `);
    const postsId: string[] = rawFoundedPosts.map((rawPost) => {
      return String(rawPost.post_id);
    });
    if (postsId.length < 1) {
      return notFoundPaginationResult;
    }
    const commentsCount: any[] = await this.dataSource.query(
      `
    SELECT COUNT(*)
    FROM public.comments c
    WHERE c."post_id" IN (${postsId}) AND c."hidden" = false
    `,
    );
    const totalCommentsCount: number = commentsCount[0].count;
    const pagesCount: number = Math.ceil(
      totalCommentsCount / paginationQuery.pageSize,
    );
    const howMuchToSkip: number =
      paginationQuery.pageSize * (paginationQuery.pageNumber - 1);
    const rawFoundedComments: any[] = await this.dataSource.query(
      `
    SELECT c."id" as "comment_id", c."content", c."created_at", c."user_id" as "commentator_id",
    u."login" as "commentator_login", p."id" as "post_id", p."title" as "post_title", p."blog_id",
    b."name" as "blog_name",
    (SELECT cl."like_status" FROM public.comments_likes cl WHERE cl."comment_id" = c."id" AND cl."user_id" = $1 AND cl."hidden" = false) as "current_user_reaction",
    (SELECT COUNT(*) FROM public.comments_likes cl2
     WHERE cl2."comment_id" = c."id" AND cl2."like_status" = true AND cl2."hidden" = false) as "likes_count",
    (SELECT COUNT(*) FROM public.comments_likes cl3
     WHERE cl3."comment_id" = c."id" AND cl3."like_status" = false AND cl3."hidden" = false) as "dislikes_count"
    FROM public.comments c
    JOIN public.users u ON u."id" = c."user_id"
    JOIN public.posts p ON p."id" = c."post_id"
    JOIN public.blogs b ON b."id" = p."blog_id"
    WHERE c."post_id" IN (${postsId}) AND c."hidden" = false
    ORDER BY c."created_at" ${paginationQuery.sortDirection.toUpperCase()}
    LIMIT ${paginationQuery.pageSize} OFFSET ${howMuchToSkip}
    `,
      [userId],
    );
    const mappedComments: CommentBloggerApiViewModel[] = rawFoundedComments.map(
      (rawComment) => {
        let myStatus: 'Like' | 'Dislike' | 'None';
        switch (rawComment.current_user_reaction) {
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
        const mappedComment: CommentBloggerApiViewModel = {
          id: String(rawComment.comment_id),
          content: rawComment.content,
          createdAt: rawComment.created_at,
          commentatorInfo: {
            userId: String(rawComment.commentator_id),
            userLogin: rawComment.commentator_login,
          },
          likesInfo: {
            likesCount: Number(rawComment.likes_count),
            dislikesCount: Number(rawComment.dislikes_count),
            myStatus,
          },
          postInfo: {
            blogId: String(rawComment.blog_id),
            blogName: rawComment.blog_name,
            title: rawComment.post_title,
            id: String(rawComment.post_id),
          },
        };
        return mappedComment;
      },
    );
    const paginationResult: CommentBloggerApiPaginationViewModel = {
      pagesCount: Number(pagesCount),
      page: Number(paginationQuery.pageNumber),
      pageSize: Number(paginationQuery.pageSize),
      totalCount: Number(totalCommentsCount),
      items: mappedComments,
    };
    return paginationResult;
  }
}
