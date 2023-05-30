import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BlogSchema } from '../../../../../libs/db/mongoose/schemes/blog.entity';
import { Model } from 'mongoose';
import {
  BlogApiModelType,
  BlogApiPaginationModelType,
} from '../../../../product-module/blog/blog-api/blog-api-models/blog-api.models';
import {
  FilterType,
  getDocumentsWithPagination,
  PaginationQueryType,
} from '../../../../modules/product/product-additional/get-documents-with-pagination.func';
import {
  PostDocument,
  PostSchema,
} from '../../../../../libs/db/mongoose/schemes/post.entity';
import { BlogApiPaginationQueryDTO } from '../../../../product-module/blog/blog-api/blog-api-models/blog-api.query-dto';
import { JwtHelpers } from '../../../../../libs/auth/jwt/jwt-helpers.service';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { Like } from '../../../../../libs/db/mongoose/schemes/like.entity';
import { EntityLikesCountType } from '../../../../public-api/like/application/models/entity-likes-count.model';
import { LikeQueryRepository } from '../../../../public-api/like/infrastructure/repositories/like.query-repository';
import { PostApiPaginationQueryDTOType } from '../../../../public-api/post/api/models/post-api.query-dto';
import {
  PostApiModel,
  PostApiPaginationModelType,
  PostNewestLikeType,
} from '../../../../public-api/post/api/models/post-api.models';
import { PostRepositoryPaginationType } from '../../../../public-api/post/infrastructure/repositories/models/post-repository.models';

@Injectable()
export class BlogBloggerQueryRepository {
  constructor(
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    private likeQueryRepository: LikeQueryRepository,
    private jwtHelpers: JwtHelpers,
  ) {}
  async getBlogsWithPagination({
    bloggerId,
    paginationQuery: rawPaginationQuery,
  }: {
    paginationQuery: BlogApiPaginationQueryDTO;
    bloggerId: string;
  }): Promise<BlogApiPaginationModelType> {
    const filter: FilterType = [{ value: bloggerId, property: 'bloggerId' }];
    const paginationQuery: PaginationQueryType = {
      pageNumber: rawPaginationQuery.pageNumber,
      pageSize: rawPaginationQuery.pageSize,
      sortBy: rawPaginationQuery.sortBy,
      sortDirection: rawPaginationQuery.sortDirection,
    };
    if (rawPaginationQuery.searchNameTerm) {
      filter.push({
        value: rawPaginationQuery.searchNameTerm,
        property: 'title',
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
    const postsWithPagination: PostRepositoryPaginationType =
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
        await this.likeQueryRepository.getEntityLikesCount(postDocument.id);
      const userLikeStatus: 'Like' | 'Dislike' | 'None' =
        await this.likeQueryRepository.getUserLikeStatus({
          userId,
          entityId: postDocument.id,
        });
      const newestLikes: Like[] =
        await this.likeQueryRepository.getEntityLastLikes(postDocument.id);
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
