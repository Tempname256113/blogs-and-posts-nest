import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { PostApiPaginationQueryDTO } from '../../api/models/post-api.query-dto';
import {
  PostNewestLikeType,
  PostPaginationViewModel,
  PostViewModel,
} from '../../api/models/post-api.models';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { PublicBlogQueryRepositorySQL } from '../../../blog/infrastructure/repositories/blog-public.query-repository-sql';
import { BlogPublicApiViewModel } from '../../../blog/api/models/blog-public-api.models';
import { PostSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/post-sql.entity';
import { LikeSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/like-sql.entity';
import { BlogSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/blog-sql.entity';

@Injectable()
export class PublicPostQueryRepositorySQL {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(PostSQLEntity)
    private readonly postEntity: Repository<PostSQLEntity>,
    @InjectRepository(LikeSQLEntity)
    private readonly likeEntity: Repository<LikeSQLEntity>,
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
    if (!Number(postId)) {
      throw new NotFoundException();
    }
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    const userId: string | undefined = accessTokenPayload?.userId;
    const getCurrentUserReaction = (
      subQuery: SelectQueryBuilder<LikeSQLEntity>,
    ): SelectQueryBuilder<LikeSQLEntity> => {
      return subQuery
        .select('l.likeStatus')
        .from(LikeSQLEntity, 'l')
        .where(
          'l.postId = :postId AND l.userId = :userId AND l.hidden = false',
          { postId, userId },
        );
    };
    const getReactionsCount = (
      reaction: boolean,
    ): ((
      subQuery: SelectQueryBuilder<LikeSQLEntity>,
    ) => SelectQueryBuilder<LikeSQLEntity>) => {
      return (
        subQuery: SelectQueryBuilder<LikeSQLEntity>,
      ): SelectQueryBuilder<LikeSQLEntity> => {
        return subQuery
          .select('COUNT(*)')
          .from(LikeSQLEntity, 'l')
          .where(
            `l.postId = :postId AND l.likeStatus = ${reaction} AND l.hidden = false`,
            { postId },
          );
      };
    };
    const queryBuilder: SelectQueryBuilder<PostSQLEntity> =
      await this.dataSource.createQueryBuilder(PostSQLEntity, 'p');
    const rawFoundedPost:
      | {
          p_id: number;
          p_title: string;
          p_shortDescription: string;
          p_content: string;
          p_createdAt: string;
          p_blogId: number;
          b_name: string;
          currentUserReaction: boolean | null;
          likesCount: string;
          dislikesCount: string;
        }
      | undefined = await queryBuilder
      .select([
        'p.id',
        'p.title',
        'p.shortDescription',
        'p.content',
        'p.createdAt',
        'p.blogId',
        'b.name',
      ])
      .addSelect(getCurrentUserReaction, 'currentUserReaction')
      .addSelect(getReactionsCount(true), 'likesCount')
      .addSelect(getReactionsCount(false), 'dislikesCount')
      .innerJoin(BlogSQLEntity, 'b', 'p.blogId = b.id')
      .where('p.id = :postId AND p.hidden = false', { postId })
      .getRawOne();
    if (!rawFoundedPost) {
      return null;
    }
    let myStatus: 'Like' | 'Dislike' | 'None';
    switch (rawFoundedPost.currentUserReaction) {
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
    const rawNewestLikes: LikeSQLEntity[] = await this.likeEntity.find({
      relations: ['user'],
      where: { postId: Number(postId), hidden: false, likeStatus: true },
      order: { addedAt: 'DESC' },
      take: 3,
      skip: 0,
    });
    const mappedNewestLikes: PostNewestLikeType[] = rawNewestLikes.map(
      (rawNewestLike) => {
        const mappedNewestLike: PostNewestLikeType = {
          addedAt: rawNewestLike.addedAt,
          userId: String(rawNewestLike.userId),
          login: rawNewestLike.user.login,
        };
        return mappedNewestLike;
      },
    );
    const postToClient: PostViewModel = {
      id: String(rawFoundedPost.p_id),
      title: rawFoundedPost.p_title,
      shortDescription: rawFoundedPost.p_shortDescription,
      content: rawFoundedPost.p_content,
      blogId: String(rawFoundedPost.p_blogId),
      blogName: rawFoundedPost.b_name,
      createdAt: rawFoundedPost.p_createdAt,
      extendedLikesInfo: {
        likesCount: Number(rawFoundedPost.likesCount),
        dislikesCount: Number(rawFoundedPost.dislikesCount),
        myStatus,
        newestLikes: mappedNewestLikes,
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
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    const userId: string | undefined = accessTokenPayload?.userId;
    const foundedBlog: BlogPublicApiViewModel | null =
      await this.blogQueryRepositorySQL.getBlogById(blogId);
    if (!foundedBlog) throw new NotFoundException();
    const getRawPosts = async (): Promise<
      {
        p_id: number;
        p_blogId: number;
        p_title: string;
        p_shortDescription: string;
        p_content: string;
        p_createdAt: string;
        b_name: string;
        currentUserReaction: boolean | null;
        likesCount: string;
        dislikesCount: string;
      }[]
    > => {
      const getCurrentUserReaction = (
        subQuery: SelectQueryBuilder<LikeSQLEntity>,
      ): SelectQueryBuilder<LikeSQLEntity> => {
        return subQuery
          .select('l.likeStatus')
          .from(LikeSQLEntity, 'l')
          .where(
            'l.postId = p.id AND l.userId = :userId AND l.hidden = false',
            { userId },
          );
      };
      const getReactionsCount = (
        reaction: boolean,
      ): ((
        subQuery: SelectQueryBuilder<LikeSQLEntity>,
      ) => SelectQueryBuilder<LikeSQLEntity>) => {
        return (
          subQuery: SelectQueryBuilder<LikeSQLEntity>,
        ): SelectQueryBuilder<LikeSQLEntity> => {
          return subQuery
            .select('COUNT(*)')
            .from(LikeSQLEntity, 'l')
            .where(
              `l.postId = p.id AND l.likeStatus = ${reaction} AND l.hidden = false`,
            );
        };
      };
      const getCorrectOrderBy = (): {
        sortQuery: string;
        sortDirection: 'ASC' | 'DESC';
      } => {
        const correctOrderDirection: 'ASC' | 'DESC' =
          paginationQuery.sortDirection === 'asc' ? 'ASC' : 'DESC';
        switch (paginationQuery.sortBy) {
          case 'createdAt':
            return {
              sortQuery: 'p.createdAt',
              sortDirection: correctOrderDirection,
            };
          case 'title':
            return {
              sortQuery: 'p.title',
              sortDirection: correctOrderDirection,
            };
        }
      };
      const orderQuery: ReturnType<typeof getCorrectOrderBy> =
        getCorrectOrderBy();
      const howMuchToSkip: number =
        paginationQuery.pageSize * (paginationQuery.pageNumber - 1);
      const queryBuilder: SelectQueryBuilder<PostSQLEntity> =
        await this.dataSource.createQueryBuilder(PostSQLEntity, 'p');
      return queryBuilder
        .select([
          'p.id',
          'p.blogId',
          'p.title',
          'p.shortDescription',
          'p.content',
          'p.createdAt',
          'b.name',
        ])
        .addSelect(getCurrentUserReaction, 'currentUserReaction')
        .addSelect(getReactionsCount(true), 'likesCount')
        .addSelect(getReactionsCount(false), 'dislikesCount')
        .innerJoin(BlogSQLEntity, 'b', 'p.blogId = b.id')
        .where('p.blogId = :blogId AND p.hidden = false', { blogId })
        .orderBy(orderQuery.sortQuery, orderQuery.sortDirection)
        .limit(paginationQuery.pageSize)
        .offset(howMuchToSkip)
        .getRawMany();
    };
    const totalPostsCount: number = await this.postEntity.countBy({
      blogId: Number(blogId),
      hidden: false,
    });
    const pagesCount: number = Math.ceil(
      totalPostsCount / paginationQuery.pageSize,
    );
    const rawFoundedPosts: Awaited<ReturnType<typeof getRawPosts>> =
      await getRawPosts();
    const mappedPosts: PostViewModel[] = [];
    for (const rawPost of rawFoundedPosts) {
      let myStatus: 'Like' | 'Dislike' | 'None';
      switch (rawPost.currentUserReaction) {
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
      const rawNewestLikes: LikeSQLEntity[] = await this.likeEntity.find({
        relations: ['user'],
        where: { postId: rawPost.p_id, hidden: false, likeStatus: true },
        order: { addedAt: 'DESC' },
        take: 3,
        skip: 0,
      });
      const mappedNewestLikes: PostNewestLikeType[] = rawNewestLikes.map(
        (rawNewestLike) => {
          const mappedNewestLike: PostNewestLikeType = {
            addedAt: rawNewestLike.addedAt,
            userId: String(rawNewestLike.userId),
            login: rawNewestLike.user.login,
          };
          return mappedNewestLike;
        },
      );
      const mappedPost: PostViewModel = {
        id: String(rawPost.p_id),
        title: rawPost.p_title,
        shortDescription: rawPost.p_shortDescription,
        content: rawPost.p_content,
        blogId: String(rawPost.p_blogId),
        blogName: rawPost.b_name,
        createdAt: rawPost.p_createdAt,
        extendedLikesInfo: {
          likesCount: Number(rawPost.likesCount),
          dislikesCount: Number(rawPost.dislikesCount),
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

  async getPostsWithPagination({
    paginationQuery,
    accessToken,
  }: {
    paginationQuery: PostApiPaginationQueryDTO;
    accessToken: string | null;
  }): Promise<PostPaginationViewModel> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    const userId: string | undefined = accessTokenPayload?.userId;
    const getCurrentUserReaction = (
      subQuery: SelectQueryBuilder<LikeSQLEntity>,
    ): SelectQueryBuilder<LikeSQLEntity> => {
      return subQuery
        .select('l.likeStatus')
        .from(LikeSQLEntity, 'l')
        .where('l.postId = p.id AND l.userId = :userId AND l.hidden = false', {
          userId,
        });
    };
    const getReactionsCount = (
      reaction: boolean,
    ): ((
      subQuery: SelectQueryBuilder<LikeSQLEntity>,
    ) => SelectQueryBuilder<LikeSQLEntity>) => {
      return (
        subQuery: SelectQueryBuilder<LikeSQLEntity>,
      ): SelectQueryBuilder<LikeSQLEntity> => {
        return subQuery
          .select('COUNT(*)')
          .from(LikeSQLEntity, 'l')
          .where(
            `l.postId = p.id AND l.likeStatus = ${reaction} AND l.hidden = false`,
          );
      };
    };
    const getCorrectOrderBy = (): {
      query: string;
      sortDirection: 'ASC' | 'DESC';
    } => {
      const correctSortDirection: 'ASC' | 'DESC' =
        paginationQuery.sortDirection === 'asc' ? 'ASC' : 'DESC';
      switch (paginationQuery.sortBy) {
        case 'createdAt':
          return {
            query: 'p.createdAt',
            sortDirection: correctSortDirection,
          };
        case 'title':
          return {
            query: 'p.title',
            sortDirection: correctSortDirection,
          };
        case 'blogName':
          return {
            query: 'b.name',
            sortDirection: correctSortDirection,
          };
      }
    };
    const orderBy: ReturnType<typeof getCorrectOrderBy> = getCorrectOrderBy();
    const totalPostsCount: number = await this.postEntity.countBy({
      hidden: false,
    });
    const howMuchToSkip: number =
      paginationQuery.pageSize * (paginationQuery.pageNumber - 1);
    const pagesCount: number = Math.ceil(
      totalPostsCount / paginationQuery.pageSize,
    );
    const queryBuilder: SelectQueryBuilder<PostSQLEntity> =
      await this.dataSource.createQueryBuilder(PostSQLEntity, 'p');
    const rawFoundedPosts: {
      p_id: number;
      p_title: string;
      p_shortDescription: string;
      p_content: string;
      p_createdAt: string;
      p_blogId: number;
      b_name: string;
      currentUserReaction: boolean | null;
      likesCount: string;
      dislikesCount: string;
    }[] = await queryBuilder
      .select([
        'p.id',
        'p.title',
        'p.shortDescription',
        'p.content',
        'p.createdAt',
        'p.blogId',
        'b.name',
      ])
      .addSelect(getCurrentUserReaction, 'currentUserReaction')
      .addSelect(getReactionsCount(true), 'likesCount')
      .addSelect(getReactionsCount(false), 'dislikesCount')
      .innerJoin(BlogSQLEntity, 'b', 'p.blogId = b.id')
      .where('p.hidden = false')
      .orderBy(orderBy.query, orderBy.sortDirection)
      .limit(paginationQuery.pageSize)
      .offset(howMuchToSkip)
      .getRawMany();
    const mappedPosts: PostViewModel[] = [];
    for (const rawPost of rawFoundedPosts) {
      let myStatus: 'Like' | 'Dislike' | 'None';
      switch (rawPost.currentUserReaction) {
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
      const rawNewestLikes: LikeSQLEntity[] = await this.likeEntity.find({
        relations: ['user'],
        where: { postId: rawPost.p_id, hidden: false, likeStatus: true },
        order: { addedAt: 'DESC' },
        take: 3,
        skip: 0,
      });
      const mappedNewestLikes: PostNewestLikeType[] = rawNewestLikes.map(
        (rawNewestLike) => {
          const mappedNewestLike: PostNewestLikeType = {
            addedAt: rawNewestLike.addedAt,
            userId: String(rawNewestLike.userId),
            login: rawNewestLike.user.login,
          };
          return mappedNewestLike;
        },
      );
      const mappedPost: PostViewModel = {
        id: String(rawPost.p_id),
        title: rawPost.p_title,
        shortDescription: rawPost.p_shortDescription,
        content: rawPost.p_content,
        blogId: String(rawPost.p_blogId),
        blogName: rawPost.b_name,
        createdAt: rawPost.p_createdAt,
        extendedLikesInfo: {
          likesCount: Number(rawPost.likesCount),
          dislikesCount: Number(rawPost.dislikesCount),
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
