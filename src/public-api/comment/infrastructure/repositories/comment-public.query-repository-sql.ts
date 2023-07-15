import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { CommentViewModel } from '../../api/models/comment-api.models';

@Injectable()
export class PublicCommentQueryRepositorySQL {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getCommentById({
    userId,
    commentId,
  }: {
    userId: string;
    commentId: string;
  }): Promise<CommentViewModel | null> {
    const commentResult: any[] = await this.dataSource.query(
      `
    SELECT c."id" as "comment_id", c."content", c."created_at", c."user_id" as "commentator_id",
    (SELECT u."login" FROM public.users u WHERE u."id" = c."user_id") as "commentator_login",
    (SELECT cl."like_status" FROM public.comments_likes cl WHERE cl."comment_id" = c."id" AND cl."user_id" = $1) as "current_user_reaction"
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
}
