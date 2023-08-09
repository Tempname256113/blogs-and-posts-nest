import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  FindOperator,
  FindOptionsOrder,
  ILike,
  In,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
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
import { UserSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/users/user-sql.entity';

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
    if (!foundedBlog) return null;
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
    const filter: Pick<
      Partial<BlogSQLEntity>,
      Exclude<keyof BlogSQLEntity, 'name'>
    > & { name?: FindOperator<string> } = {};
    const getCorrectBlogsFilter = (): void => {
      filter.bloggerId = Number(bloggerId);
      if (paginationQuery.searchNameTerm) {
        filter.name = ILike(`%${paginationQuery.searchNameTerm}%`);
      }
    };
    getCorrectBlogsFilter();
    const orderBy: FindOptionsOrder<BlogSQLEntity> = {};
    const getCorrectOrderBy = (): void => {
      switch (paginationQuery.sortBy) {
        case 'createdAt':
          orderBy.createdAt = paginationQuery.sortDirection;
          break;
        case 'name':
          orderBy.name = paginationQuery.sortDirection;
          break;
        case 'description':
          orderBy.description = paginationQuery.sortDirection;
          break;
      }
    };
    getCorrectOrderBy();
    const howMuchToSkip: number =
      paginationQuery.pageSize * (paginationQuery.pageNumber - 1);
    const [foundedBlogs, totalBlogsCount]: [BlogSQLEntity[], number] =
      await this.blogEntity.findAndCount({
        where: filter,
        order: orderBy,
        take: paginationQuery.pageSize,
        skip: howMuchToSkip,
      });
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
        currentUserReaction: boolean | null;
        likesCount: string;
        dislikesCount: string;
      }[]
    > => {
      const getCurrentUserLikeStatus = (
        subQuery?: SelectQueryBuilder<LikeSQLEntity>,
      ): SelectQueryBuilder<LikeSQLEntity> => {
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
              `l.commentId = c.id AND l.likeStatus = :likeStatus AND l.hidden = false`,
              { likeStatus: reaction },
            );
        };
      };
      const queryBuilder = await this.dataSource.createQueryBuilder(
        CommentSQLEntity,
        'c',
      );
      const howMuchToSkip: number =
        paginationQuery.pageSize * (paginationQuery.pageNumber - 1);
      const correctOrderDirection: 'ASC' | 'DESC' =
        paginationQuery.sortDirection === 'asc' ? 'ASC' : 'DESC';
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
        .innerJoin(UserSQLEntity, 'u', 'c.userId = u.id')
        .innerJoin(PostSQLEntity, 'p', 'c.postId = p.id')
        .innerJoin(BlogSQLEntity, 'b', 'p.blogId = b.id')
        .where('c.postId IN (:...postsId) AND c.hidden = false', { postsId })
        .orderBy('c.createdAt', correctOrderDirection)
        .limit(paginationQuery.pageSize)
        .offset(howMuchToSkip)
        .getRawMany();
    };
    const rawFoundedComments: Awaited<ReturnType<typeof getRawComments>> =
      await getRawComments();
    const totalCommentsCount: number = await this.commentEntity.countBy({
      postId: In(postsId),
      hidden: false,
    });
    const pagesCount: number = Math.ceil(
      totalCommentsCount / paginationQuery.pageSize,
    );
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
