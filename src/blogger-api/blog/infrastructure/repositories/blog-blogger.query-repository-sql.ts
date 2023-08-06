import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository, SelectQueryBuilder } from 'typeorm';
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
import { PostSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/post-sql.entity';
import { CommentSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/comment-sql.entity';
import { LikeSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/like-sql.entity';

@Injectable()
export class BloggerBlogQueryRepositorySQL {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(BlogSQLEntity)
    private readonly blogEntity: Repository<BlogSQLEntity>,
    @InjectRepository(PostSQLEntity)
    private readonly postEntity: Repository<PostSQLEntity>,
    @InjectRepository(CommentSQLEntity)
    private readonly commentEntity: Repository<CommentSQLEntity>,
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
    const queryBuilder: SelectQueryBuilder<BlogSQLEntity> =
      await this.dataSource.createQueryBuilder(BlogSQLEntity, 'b');
    queryBuilder.select('b');
    const getCorrectBlogsFilter = (): void => {
      if (paginationQuery.searchNameTerm) {
        queryBuilder.where('b.name ILIKE :name AND b.bloggerId = :bloggerId', {
          name: `%${paginationQuery.searchNameTerm}%`,
          bloggerId: Number(bloggerId),
        });
      } else {
        queryBuilder.where('b.bloggerId = :bloggerId', {
          bloggerId: Number(bloggerId),
        });
      }
    };
    getCorrectBlogsFilter();
    const getCorrectOrderBy = (): void => {
      const correctSortDirection: 'ASC' | 'DESC' =
        paginationQuery.sortDirection === 'asc' ? 'ASC' : 'DESC';
      switch (paginationQuery.sortBy) {
        case 'createdAt':
          queryBuilder.orderBy('b.createdAt', correctSortDirection);
          break;
        case 'name':
          queryBuilder.orderBy('b.name', correctSortDirection);
          break;
        case 'description':
          queryBuilder.orderBy('b.description', correctSortDirection);
          break;
      }
    };
    getCorrectOrderBy();
    const howMuchToSkip: number =
      paginationQuery.pageSize * (paginationQuery.pageNumber - 1);
    queryBuilder.limit(paginationQuery.pageSize);
    queryBuilder.offset(howMuchToSkip);
    const [foundedBlogs, totalBlogsCount] =
      await queryBuilder.getManyAndCount();
    const pagesCount: number = Math.ceil(
      totalBlogsCount / paginationQuery.pageSize,
    );
    const mappedBlogs: BlogBloggerApiViewModel[] = foundedBlogs.map(
      (blogFromDB) => {
        const mappedBlog: BlogBloggerApiViewModel = {
          id: String(blogFromDB.id),
          name: blogFromDB.name,
          description: blogFromDB.description,
          websiteUrl: blogFromDB.websiteUrl,
          createdAt: blogFromDB.createdAt,
          isMembership: blogFromDB.isMembership,
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
    const getBlogsId = async (): Promise<string[]> => {
      const queryBuilder: SelectQueryBuilder<BlogSQLEntity> =
        await this.dataSource.createQueryBuilder(BlogSQLEntity, 'b');
      const rawFoundedBlogs: { id: number }[] = await queryBuilder
        .select('b.id')
        .where('b.bloggerId = :bloggerId AND b.hidden = false', {
          bloggerId: Number(userId),
        })
        .getMany();
      const blogsId: string[] = rawFoundedBlogs.map((rawBlog) => {
        return String(rawBlog.id);
      });
      return blogsId;
    };
    const getPostsId = async (): Promise<string[]> => {
      const queryBuilder: SelectQueryBuilder<PostSQLEntity> =
        await this.dataSource.createQueryBuilder(PostSQLEntity, 'p');
      const blogsId: string[] = await getBlogsId();
      if (blogsId.length < 1) return [];
      const rawFoundedPosts: { id: number }[] = await queryBuilder
        .select('p.id')
        .where('p.blogId IN (:...blogsId) AND p.hidden = false', { blogsId })
        .getMany();
      const postsId: string[] = rawFoundedPosts.map((rawPost) => {
        return String(rawPost.id);
      });
      return postsId;
    };
    const postsId: string[] = await getPostsId();
    if (postsId.length < 1) return notFoundPaginationResult;
    const totalCommentsCount: number = await this.commentEntity.countBy({
      postId: In(postsId),
      hidden: false,
    });
    const pagesCount: number = Math.ceil(
      totalCommentsCount / paginationQuery.pageSize,
    );
    const howMuchToSkip: number =
      paginationQuery.pageSize * (paginationQuery.pageNumber - 1);
    const getRawComments = async (): Promise<
      {
        c_id: number;
        c_userId: number;
        c_content: string;
        c_createdAt: string;
        u_login: string;
        p_id: number;
        p_blogId: number;
        p_title: string;
        b_name: string;
        currentUserReaction: boolean;
        likesCount: string;
        dislikesCount: string;
      }[]
    > => {
      const correctOrderDirection: 'ASC' | 'DESC' =
        paginationQuery.sortDirection === 'asc' ? 'ASC' : 'DESC';
      const queryBuilder = await this.dataSource.createQueryBuilder(
        CommentSQLEntity,
        'c',
      );
      const getCurrentUserLikeStatus = (
        subQuery?: SelectQueryBuilder<any>,
      ): SelectQueryBuilder<any> => {
        return subQuery
          .select('l.likeStatus')
          .from(LikeSQLEntity, 'l')
          .where(
            'l.commentId = c.id AND l.userId = :userId AND l.hidden = false',
            { userId },
          );
      };
      const getReactionsCount = (
        reaction: boolean,
      ): ((subQuery: SelectQueryBuilder<any>) => SelectQueryBuilder<any>) => {
        return (subQuery: SelectQueryBuilder<any>): SelectQueryBuilder<any> => {
          return subQuery
            .select('COUNT(*)')
            .from(LikeSQLEntity, 'l')
            .where(
              `l.commentId = c.id AND l.likeStatus = ${reaction} AND l.hidden = false`,
            );
        };
      };
      return queryBuilder
        .select([
          'c.id',
          'c.content',
          'c.createdAt',
          'c.userId',
          'u.login',
          'p.id',
          'p.title',
          'p.blogId',
          'b.name',
        ])
        .addSelect(getCurrentUserLikeStatus, 'currentUserReaction')
        .addSelect(getReactionsCount(true), 'likesCount')
        .addSelect(getReactionsCount(false), 'dislikesCount')
        .innerJoin('c.user', 'u')
        .innerJoin('c.post', 'p')
        .innerJoin('p.blog', 'b')
        .where('c.postId IN (:...postsId) AND c.hidden = false', { postsId })
        .orderBy('c.createdAt', correctOrderDirection)
        .limit(paginationQuery.pageSize)
        .offset(howMuchToSkip)
        .getRawMany();
    };
    const rawFoundedComments: Awaited<ReturnType<typeof getRawComments>> =
      await getRawComments();
    const mappedComments: CommentBloggerApiViewModel[] = rawFoundedComments.map(
      (rawComment) => {
        let myStatus: 'Like' | 'Dislike' | 'None';
        switch (rawComment.currentUserReaction) {
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
          id: String(rawComment.c_id),
          content: rawComment.c_content,
          createdAt: rawComment.c_createdAt,
          commentatorInfo: {
            userId: String(rawComment.c_userId),
            userLogin: rawComment.u_login,
          },
          likesInfo: {
            likesCount: Number(rawComment.likesCount),
            dislikesCount: Number(rawComment.dislikesCount),
            myStatus,
          },
          postInfo: {
            blogId: String(rawComment.p_blogId),
            blogName: rawComment.b_name,
            title: rawComment.p_title,
            id: String(rawComment.p_id),
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
