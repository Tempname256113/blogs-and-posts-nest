import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import {
  CommentPaginationViewModel,
  CommentViewModel,
} from '../../api/models/comment-api.models';
import { CommentApiPaginationQueryDto } from '../../api/models/comment-api.query-dto';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';

@Injectable()
export class PublicCommentQueryRepositorySQL {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
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
    const userId: string | null = accessTokenPayload?.userId;
    let currentUserReactionQuery: string;
    if (userId) {
      currentUserReactionQuery = `(
      SELECT cl."like_status"
      FROM public.comments_likes cl
      WHERE cl."comment_id" = c."id" AND cl."user_id" = '${userId}' AND cl."hidden" = false)
      as "current_user_reaction",`;
    } else {
      currentUserReactionQuery = `(SELECT null) as "current_user_reaction",`;
    }
    const rawFoundedComment: any[] = await this.dataSource.query(
      `
    SELECT c."id" as "comment_id", c."content", c."created_at", c."user_id" as "commentator_id",
    u."login" as "commentator_login",
    ${currentUserReactionQuery}
    (SELECT COUNT(*) FROM public.comments_likes cl2
     WHERE cl2."comment_id" = c."id" AND cl2."like_status" = true AND cl2."hidden" = false) as "likes_count",
    (SELECT COUNT(*) FROM public.comments_likes cl3
     WHERE cl3."comment_id" = c."id" AND cl3."like_status" = false AND cl3."hidden" = false) as "dislikes_count"
    FROM public.comments c
    JOIN public.users u ON u."id" = c."user_id"
    WHERE c."id" = $1 AND c."hidden" = false
    `,
      [commentId],
    );
    if (rawFoundedComment.length < 1) {
      return null;
    }
    const foundedComment: any = rawFoundedComment[0];
    let currentUserReaction: 'Like' | 'Dislike' | 'None';
    switch (foundedComment.current_user_reaction) {
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
      id: String(foundedComment.comment_id),
      content: foundedComment.content,
      commentatorInfo: {
        userId: String(foundedComment.commentator_id),
        userLogin: foundedComment.commentator_login,
      },
      createdAt: foundedComment.created_at,
      likesInfo: {
        likesCount: Number(foundedComment.likes_count),
        dislikesCount: Number(foundedComment.dislikes_count),
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
    const userId: string | null = accessTokenPayload?.userId;
    let currentUserReactionQuery: string;
    if (userId) {
      currentUserReactionQuery = `(
      SELECT cl."like_status"
      FROM public.comments_likes cl
      WHERE cl."comment_id" = c."id" AND cl."user_id" = '${userId}' AND cl."hidden" = false)
      as "current_user_reaction",`;
    } else {
      currentUserReactionQuery = `(SELECT null) as "current_user_reaction",`;
    }
    const commentsCount: any[] = await this.dataSource.query(
      `
    SELECT COUNT(*)
    FROM public.comments c
    WHERE c."post_id" = $1 AND c."hidden" = false
    `,
      [postId],
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
    u."login" as "commentator_login",
    ${currentUserReactionQuery}
    (SELECT COUNT(*) FROM public.comments_likes cl2
     WHERE cl2."comment_id" = c."id" AND cl2."like_status" = true AND cl2."hidden" = false) as "likes_count",
    (SELECT COUNT(*) FROM public.comments_likes cl3
     WHERE cl3."comment_id" = c."id" AND cl3."like_status" = false AND cl3."hidden" = false) as "dislikes_count"
    FROM public.comments c
    JOIN public.users u ON u."id" = c."user_id"
    WHERE c."post_id" = $1 AND c."hidden" = false
    ORDER BY c."created_at" ${paginationQuery.sortDirection.toUpperCase()}
    LIMIT ${paginationQuery.pageSize} OFFSET ${howMuchToSkip}
    `,
      [postId],
    );
    const mappedComments: CommentViewModel[] = rawFoundedComments.map(
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
        const mappedComment: CommentViewModel = {
          id: String(rawComment.comment_id),
          content: rawComment.content,
          commentatorInfo: {
            userId: String(rawComment.commentator_id),
            userLogin: rawComment.commentator_login,
          },
          createdAt: rawComment.created_at,
          likesInfo: {
            likesCount: Number(rawComment.likes_count),
            dislikesCount: Number(rawComment.dislikes_count),
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
