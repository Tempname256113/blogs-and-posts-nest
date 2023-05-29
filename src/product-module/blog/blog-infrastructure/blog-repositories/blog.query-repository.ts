import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BlogSchema } from '../../../../../libs/db/mongoose/schemes/blog.entity';
import { Model } from 'mongoose';
import {
  BlogApiModelType,
  BlogApiPaginationModelType,
} from '../../blog-api/blog-api-models/blog-api.models';
import {
  FilterType,
  getDocumentsWithPagination,
  PaginationQueryType,
} from '../../../product-additional/get-documents-with-pagination.func';
import {
  PostDocument,
  PostSchema,
} from '../../../../../libs/db/mongoose/schemes/post.entity';
import { PostRepositoryPaginationModelType } from '../../../post/post-infrastructure/post-repositories/post-repositories-models/post-repository.models';
import {
  PostApiModel,
  PostApiPaginationModelType,
  PostNewestLikeType,
} from '../../../post/post-api/post-api-models/post-api.models';
import { BlogApiPaginationQueryDTO } from '../../blog-api/blog-api-models/blog-api.query-dto';
import { PostApiPaginationQueryDTOType } from '../../../post/post-api/post-api-models/post-api.query-dto';
import {
  EntityLikesCountType,
  LikeService,
} from '../../../like/like-application/like.service';
import { JwtHelpers } from '../../../../../libs/auth/jwt/jwt-helpers.service';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { Like } from '../../../../../libs/db/mongoose/schemes/like.entity';

@Injectable()
export class BlogQueryRepository {
  constructor(
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    private likeService: LikeService,
    private jwtHelpers: JwtHelpers,
  ) {}
  async getBlogsWithPagination(
    rawPaginationQuery: BlogApiPaginationQueryDTO,
  ): Promise<BlogApiPaginationModelType> {
    const filter: FilterType = [];
    const paginationQuery: PaginationQueryType = {
      pageNumber: rawPaginationQuery.pageNumber,
      pageSize: rawPaginationQuery.pageSize,
      sortBy: rawPaginationQuery.sortBy,
      sortDirection: rawPaginationQuery.sortDirection,
    };
    if (rawPaginationQuery.searchNameTerm) {
      filter.push({
        value: rawPaginationQuery.searchNameTerm,
        property: rawPaginationQuery.sortBy,
      });
    }
    const blogsWithPagination: BlogApiPaginationModelType =
      await getDocumentsWithPagination<BlogApiModelType>({
        query: paginationQuery,
        model: this.BlogModel,
        rawFilter: filter,
        lean: true,
      });
    return blogsWithPagination;
  }

  async getPostsWithPaginationByBlogId({
    rawPaginationQuery,
    blogId,
    accessToken,
  }: {
    rawPaginationQuery: PostApiPaginationQueryDTOType;
    blogId: string;
    accessToken: string | null;
  }): Promise<PostApiPaginationModelType> {
    const postsWithPagination: PostRepositoryPaginationModelType =
      await getDocumentsWithPagination<PostDocument>({
        query: rawPaginationQuery,
        model: this.PostModel,
        rawFilter: [{ property: 'blogId', value: blogId }],
        lean: true,
      });
    const getUserId = (): string | null => {
      if (!accessToken) {
        return null;
      } else {
        const accessTokenPayload: JwtAccessTokenPayloadType | null =
          this.jwtHelpers.verifyAccessToken(accessToken);
        if (!accessToken) {
          return null;
        } else {
          return accessTokenPayload.userId;
        }
      }
    };
    const userId: string = getUserId();
    const mappedPosts: PostApiModel[] = [];
    for (const postDocument of postsWithPagination.items) {
      const countOfReactions: EntityLikesCountType =
        await this.likeService.getEntityLikesCount(postDocument.id);
      const userLikeStatus: 'Like' | 'Dislike' | 'None' =
        await this.likeService.getUserLikeStatus({
          userId,
          entityId: postDocument.id,
        });
      const newestLikes: Like[] = await this.likeService.getEntityLastLikes(
        postDocument.id,
      );
      const mappedNewestLikes: PostNewestLikeType[] = [];
      for (const rawLike of newestLikes) {
        const mappedLike: PostNewestLikeType = {
          userId: rawLike.userId,
          login: rawLike.userLogin,
          addedAt: rawLike.addedAt,
        };
        mappedNewestLikes.push(mappedLike);
      }
      const resultPost: PostApiModel = {
        id: postDocument.id,
        title: postDocument.title,
        shortDescription: postDocument.shortDescription,
        content: postDocument.content,
        blogId: postDocument.blogId,
        blogName: postDocument.blogName,
        createdAt: postDocument.createdAt,
        extendedLikesInfo: {
          likesCount: countOfReactions.likesCount,
          dislikesCount: countOfReactions.dislikesCount,
          myStatus: userLikeStatus,
          newestLikes: mappedNewestLikes,
        },
      };
      mappedPosts.push(resultPost);
    }
    const resultPostsPagination: PostApiPaginationModelType = {
      pagesCount: postsWithPagination.pagesCount,
      page: postsWithPagination.page,
      pageSize: postsWithPagination.pageSize,
      totalCount: postsWithPagination.totalCount,
      items: mappedPosts,
    };
    return resultPostsPagination;
  }

  async getBlogById(blogId: string): Promise<BlogApiModelType | null> {
    return this.BlogModel.findOne({ id: blogId }, { _id: false }).lean();
  }
}
