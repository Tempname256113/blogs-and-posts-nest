import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
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
import { PostSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/post-sql.entity';
import { LikeSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/like-sql.entity';

@Injectable()
export class BloggerPostQueryRepositorySQL {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(PostSQLEntity)
    private readonly postEntity: Repository<PostSQLEntity>,
    @InjectRepository(LikeSQLEntity)
    private readonly likeEntity: Repository<LikeSQLEntity>,
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
    const checkBlogOwner = async (): Promise<void> => {
      const foundedBlogById: BloggerRepositoryBlogType | null =
        await this.blogQueryRepositorySQL.getBlogByIdInternalUse(blogId);
      if (!foundedBlogById) throw new NotFoundException();
      if (bloggerId !== foundedBlogById.bloggerId) {
        throw new ForbiddenException();
      }
    };
    await checkBlogOwner();
    const getRawPosts = async (): Promise<
      {
        p_id: number;
        p_title: string;
        p_shortDescription: string;
        p_content: string;
        p_createdAt: string;
        p_blogId: number;
        b_name: string;
        currentUserReaction: boolean;
        likesCount: string;
        dislikesCount: string;
      }[]
    > => {
      const howMuchToSkip: number =
        paginationQuery.pageSize * (paginationQuery.pageNumber - 1);
      const getCorrectOrderQuery = (): {
        sortQuery: string;
        sortDirection: 'ASC' | 'DESC';
      } => {
        const correctSortDirection: 'ASC' | 'DESC' =
          paginationQuery.sortDirection === 'asc' ? 'ASC' : 'DESC';
        if (paginationQuery.sortBy === 'createdAt') {
          return {
            sortQuery: 'p.createdAt',
            sortDirection: correctSortDirection,
          };
        } else if (paginationQuery.sortBy === 'title') {
          return {
            sortQuery: 'p.title',
            sortDirection: correctSortDirection,
          };
        }
      };
      const getCurrentUserReaction = (
        subQuery: SelectQueryBuilder<LikeSQLEntity>,
      ): SelectQueryBuilder<LikeSQLEntity> => {
        return subQuery
          .select('l.likeStatus')
          .from(LikeSQLEntity, 'l')
          .where(
            'l.postId = p.id AND l.userId = :userId AND l.hidden = false',
            {
              userId: bloggerId,
            },
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
              'l.postId = p.id AND l.likeStatus = :likeStatus AND l.hidden = false',
              { likeStatus: reaction },
            );
        };
      };
      const {
        sortQuery: correctSortQuery,
        sortDirection: correctSortDirection,
      } = getCorrectOrderQuery();
      const queryBuilder: SelectQueryBuilder<PostSQLEntity> =
        await this.dataSource.createQueryBuilder(PostSQLEntity, 'p');
      return queryBuilder
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
        .innerJoin('p.blog', 'b', 'p.blogId = b.id')
        .where('p.blogId = :blogId AND p.hidden = false', { blogId })
        .orderBy(correctSortQuery, correctSortDirection)
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
        take: 3,
        skip: 0,
        order: { addedAt: 'DESC' },
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
