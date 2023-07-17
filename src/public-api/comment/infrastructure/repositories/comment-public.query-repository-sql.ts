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
      WHERE cl."comment_id" = c."id" AND cl."user_id" = $1)
      as "current_user_reaction"`;
    } else {
      currentUserReactionQuery = `(SELECT null) as "current_user_reaction"`;
    }
    const commentResult: any[] = await this.dataSource.query(
      `
    SELECT c."id" as "comment_id", c."content", c."created_at", c."user_id" as "commentator_id",
    (SELECT u."login" FROM public.users u WHERE u."id" = c."user_id") as "commentator_login",
    ${currentUserReactionQuery}
    FROM public.comments c
    WHERE c."id" = $2
    `,
      [userId, commentId],
    );
    if (commentResult.length < 1) {
      return null;
    }
    const reactionsCountResult: any[] = await this.dataSource.query(
      `
    SELECT count(*) as "likes_count",
    (SELECT count(*)
    FROM public.comments_likes cl 
    WHERE cl."comment_id" = $1 AND cl."like_status" = false) as "dislikes_count"
    FROM public.comments_likes cl
    WHERE cl."comment_id" = $1 AND cl."like_status" = true
    `,
      [commentId],
    );
    const commentRes: any = commentResult[0];
    const reactionsRes: any = reactionsCountResult[0];
    let currentUserReaction: 'Like' | 'Dislike' | 'None';
    switch (commentRes.current_user_reaction) {
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
      id: commentRes.comment_id,
      content: commentRes.content,
      commentatorInfo: {
        userId: commentRes.commentator_id,
        userLogin: commentRes.commentator_login,
      },
      createdAt: commentRes.created_at,
      likesInfo: {
        likesCount: reactionsRes.likes_count,
        dislikesCount: reactionsRes.dislikes_count,
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
      WHERE cl."comment_id" = c."id" AND cl."user_id" = $1)
      as "current_user_reaction"`;
    } else {
      currentUserReactionQuery = `(SELECT null) as "current_user_reaction"`;
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
    const commentsResult: any[] = await this.dataSource.query(
      `
    SELECT c."id" as "comment_id", c."content", c."created_at", c."user_id" as "commentator_id",
    (SELECT u."login" FROM public.users u WHERE u."id" = c."user_id") as "commentator_login",
    ${currentUserReactionQuery}
    FROM public.comments c
    WHERE c."post_id" = $2 AND c."hidden" = false
    ORDER BY c."created_at" ${paginationQuery.sortDirection.toUpperCase()}
    LIMIT ${paginationQuery.pageSize} OFFSET ${howMuchToSkip}
    `,
      [userId, postId],
    );
    const arrayWithMappedComments: CommentViewModel[] = [];
    for (const rawComment of commentsResult) {
      const reactionsCountResult: any[] = await this.dataSource.query(
        `
    SELECT count(*) as "likes_count",
    (SELECT count(*)
    FROM public.comments_likes cl 
    WHERE cl."comment_id" = $1 AND cl."like_status" = false) as "dislikes_count"
    FROM public.comments_likes cl
    WHERE cl."comment_id" = $1 AND cl."like_status" = true
    `,
        [rawComment.comment_id],
      );
      const reactionsRes: any = reactionsCountResult[0];
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
          likesCount: reactionsRes.likes_count,
          dislikesCount: reactionsRes.dislikes_count,
          myStatus,
        },
      };
      arrayWithMappedComments.push(mappedComment);
    }
    const paginationResult: CommentPaginationViewModel = {
      pagesCount: Number(pagesCount),
      page: Number(paginationQuery.pageNumber),
      pageSize: Number(paginationQuery.pageSize),
      totalCount: Number(totalCommentsCount),
      items: arrayWithMappedComments,
    };
    return paginationResult;
  }
}
