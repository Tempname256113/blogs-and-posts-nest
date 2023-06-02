import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Blog,
  BlogDocument,
  BlogSchema,
} from '../../../../../libs/db/mongoose/schemes/blog.entity';
import { FilterQuery, Model, QueryOptions } from 'mongoose';
import {
  BlogApiModelType,
  BlogApiPaginationModelType,
} from '../../../../product-module/blog/blog-api/blog-api-models/blog-api.models';
import {
  FilterType,
  PaginationQueryType,
} from '../../../../modules/product/product-additional/get-documents-with-pagination.func';
import {
  PostDocument,
  PostSchema,
} from '../../../../../libs/db/mongoose/schemes/post.entity';
import { PostRepositoryPaginationType } from '../../../post/infrastructure/repositories/models/post-repository.models';
import {
  PostApiModel,
  PostApiPaginationModelType,
  PostNewestLikeType,
} from '../../../post/api/models/post-api.models';
import { BlogApiPaginationQueryDTO } from '../../../../product-module/blog/blog-api/blog-api-models/blog-api.query-dto';
import { PostApiPaginationQueryDTOType } from '../../../post/api/models/post-api.query-dto';
import { JwtHelpers } from '../../../../../libs/auth/jwt/jwt-helpers.service';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { Like } from '../../../../../libs/db/mongoose/schemes/like.entity';
import { LikeQueryRepository } from '../../../like/infrastructure/repositories/like.query-repository';
import { EntityLikesCountType } from '../../../like/application/models/entity-likes-count.model';

@Injectable()
export class BlogPublicQueryRepository {
  constructor(
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    private likeQueryRepository: LikeQueryRepository,
    private jwtHelpers: JwtHelpers,
  ) {}
  async getBlogsWithPagination(
    rawPaginationQuery: BlogApiPaginationQueryDTO,
  ): Promise<BlogApiPaginationModelType> {
    const blogsWithPagination =
      async (): Promise<BlogApiPaginationModelType> => {
        const getCorrectSortQuery = (): { [sortByProp: string]: number } => {
          let sortDirection: 1 | -1 = -1;
          if (rawPaginationQuery.sortDirection === 'asc') sortDirection = 1;
          if (rawPaginationQuery.sortDirection === 'desc') sortDirection = -1;
          const sortQuery = { [rawPaginationQuery.sortBy]: sortDirection };
          return sortQuery;
        };
        let filter: FilterQuery<BlogSchema>;
        if (!rawPaginationQuery.searchNameTerm) {
          filter = {};
        } else {
          filter = {
            name: {
              $regex: [rawPaginationQuery.searchNameTerm],
              $options: 'i',
            },
          };
        }
        const totalBlogsCount: number = await this.BlogModel.countDocuments(
          filter,
        );
        const sortQuery = getCorrectSortQuery();
        const howMuchToSkip: number =
          rawPaginationQuery.pageSize * (rawPaginationQuery.pageNumber - 1);
        const pagesCount: number = Math.ceil(
          totalBlogsCount / rawPaginationQuery.pageSize,
        );
        const foundedBlogs: Blog[] = await this.BlogModel.find(
          filter,
          { _id: false },
          {
            limit: rawPaginationQuery.pageSize,
            skip: howMuchToSkip,
            sort: sortQuery,
          },
        ).lean();
        const mappedBlogs: BlogApiModelType[] = foundedBlogs.map(
          (blogFromDB) => {
            const mappedBlog: BlogApiModelType = {
              id: blogFromDB.id,
              name: blogFromDB.name,
              description: blogFromDB.description,
              websiteUrl: blogFromDB.websiteUrl,
              createdAt: blogFromDB.createdAt,
              isMembership: blogFromDB.isMembership,
            };
            return mappedBlog;
          },
        );
        const paginationBlogsResult: BlogApiPaginationModelType = {
          pagesCount,
          page: Number(rawPaginationQuery.pageNumber),
          pageSize: Number(rawPaginationQuery.pageSize),
          totalCount: Number(totalBlogsCount),
          items: mappedBlogs,
        };
        return paginationBlogsResult;
      };
    return blogsWithPagination();
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
        filter: [{ property: 'blogId', value: blogId }],
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

  async getBlogById(blogId: string): Promise<BlogDocument | null> {
    return this.BlogModel.findOne(
      { id: blogId, hidden: false },
      { _id: false },
    );
  }
}
