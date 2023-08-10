import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Injectable } from '@nestjs/common';
import {
  CommentPaginationViewModel,
  CommentViewModel,
} from '../../api/models/comment-api.models';
import { CommentApiPaginationQueryDto } from '../../api/models/comment-api.query-dto';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { CommentSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/comment-sql.entity';
import { LikeSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/like-sql.entity';
import { UserSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/users/user-sql.entity';

@Injectable()
export class PublicCommentQueryRepositorySQL {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(CommentSQLEntity)
    private readonly commentEntity: Repository<CommentSQLEntity>,
    @InjectRepository(LikeSQLEntity)
    private readonly likeEntity: Repository<LikeSQLEntity>,
    private readonly jwtUtils: JwtUtils,
  ) {}

  async getCommentById({
    accessToken,
    commentId,
  }: {
    accessToken: string | null;
    commentId: string;
  }): Promise<CommentViewModel | null> {
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
            'l.commentId = c.id AND l.likeStatus = :likeStatus AND l.hidden = false',
            { likeStatus: reaction },
          );
      };
    };
    const queryBuilder: SelectQueryBuilder<CommentSQLEntity> =
      await this.dataSource.createQueryBuilder(CommentSQLEntity, 'c');
    const foundedComment:
      | {
          c_id: number;
          c_content: string;
          c_createdAt: string;
          c_userId: number;
          u_login: string;
          currentUserReaction: boolean | null;
          likesCount: string;
          dislikesCount: string;
        }
      | undefined = await queryBuilder
      .select(['c.id', 'c.content', 'c.createdAt', 'c.userId', 'u.login'])
      .addSelect(getCurrentUserReaction, 'currentUserReaction')
      .addSelect(getReactionsCount(true), 'likesCount')
      .addSelect(getReactionsCount(false), 'dislikesCount')
      .innerJoin(UserSQLEntity, 'u', 'c.userId = u.id')
      .where('c.id = :commentId AND c.hidden = false', { commentId })
      .getRawOne();
    if (!foundedComment) return null;
    let currentUserReaction: 'Like' | 'Dislike' | 'None';
    switch (foundedComment.currentUserReaction) {
      case true:
        currentUserReaction = 'Like';
        break;
      case false:
        currentUserReaction = 'Dislike';
        break;
      case null:
        currentUserReaction = 'None';
        break;
    }
    const mappedComment: CommentViewModel = {
      id: String(foundedComment.c_id),
      content: foundedComment.c_content,
      commentatorInfo: {
        userId: String(foundedComment.c_userId),
        userLogin: foundedComment.u_login,
      },
      createdAt: foundedComment.c_createdAt,
      likesInfo: {
        likesCount: Number(foundedComment.likesCount),
        dislikesCount: Number(foundedComment.dislikesCount),
        myStatus: currentUserReaction,
      },
    };
    return mappedComment;
  }

  async getAllCommentsForSpecifiedPost({
    paginationQuery,
    postId,
    accessToken,
  }: {
    paginationQuery: CommentApiPaginationQueryDto;
    postId: string;
    accessToken: string | null;
  }): Promise<CommentPaginationViewModel> {
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
            'l.commentId = c.id AND l.likeStatus = :likeStatus AND l.hidden = false',
            { likeStatus: reaction },
          );
      };
    };
    const totalCommentsCount: number = await this.commentEntity.countBy({
      postId: Number(postId),
      hidden: false,
    });
    const pagesCount: number = Math.ceil(
      totalCommentsCount / paginationQuery.pageSize,
    );
    const howMuchToSkip: number =
      paginationQuery.pageSize * (paginationQuery.pageNumber - 1);
    const correctSortDirection: 'ASC' | 'DESC' =
      paginationQuery.sortDirection === 'asc' ? 'ASC' : 'DESC';
    const queryBuilder: SelectQueryBuilder<CommentSQLEntity> =
      await this.dataSource.createQueryBuilder(CommentSQLEntity, 'c');
    const rawFoundedComments: {
      c_id: number;
      c_content: string;
      c_createdAt: string;
      c_userId: number;
      u_login: string;
      currentUserReaction: boolean | null;
      likesCount: string;
      dislikesCount: string;
    }[] = await queryBuilder
      .select(['c.id', 'c.content', 'c.createdAt', 'c.userId', 'u.login'])
      .addSelect(getCurrentUserReaction, 'currentUserReaction')
      .addSelect(getReactionsCount(true), 'likesCount')
      .addSelect(getReactionsCount(false), 'dislikesCount')
      .innerJoin(UserSQLEntity, 'u', 'c.userId = u.id')
      .where('c.postId = :postId AND c.hidden = false', { postId })
      .orderBy('createdAt', correctSortDirection)
      .limit(paginationQuery.pageSize)
      .offset(howMuchToSkip)
      .getRawMany();
    const mappedComments: CommentViewModel[] = rawFoundedComments.map(
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
        const mappedComment: CommentViewModel = {
          id: String(rawComment.c_id),
          content: rawComment.c_content,
          commentatorInfo: {
            userId: String(rawComment.c_userId),
            userLogin: rawComment.u_login,
          },
          createdAt: rawComment.c_createdAt,
          likesInfo: {
            likesCount: Number(rawComment.likesCount),
            dislikesCount: Number(rawComment.dislikesCount),
            myStatus,
          },
        };
        return mappedComment;
      },
    );
    const paginationResult: CommentPaginationViewModel = {
      pagesCount: Number(pagesCount),
      page: Number(paginationQuery.pageNumber),
      pageSize: Number(paginationQuery.pageSize),
      totalCount: Number(totalCommentsCount),
      items: mappedComments,
    };
    return paginationResult;
  }
}
