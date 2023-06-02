import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Blog,
  BlogDocument,
  BlogSchema,
} from '../../../../../libs/db/mongoose/schemes/blog.entity';
import { FilterQuery, Model } from 'mongoose';
import {
  BlogApiModelType,
  BlogApiPaginationModelType,
} from '../../../../product-module/blog/blog-api/blog-api-models/blog-api.models';
import {
  getPaginationHelpers,
  PaginationHelpersType,
} from '../../../../modules/product/product-additional/get-documents-with-pagination.func';
import {
  Post,
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

@Injectable()
export class BlogBloggerQueryRepository {
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
        let filter: FilterQuery<BlogSchema>;
        const getCorrectBlogsFilter = (): void => {
          if (!rawPaginationQuery.searchNameTerm) {
            filter = { hidden: false };
          } else {
            filter = {
              name: {
                $regex: [rawPaginationQuery.searchNameTerm],
                $options: 'i',
              },
              hidden: false,
            };
          }
        };
        getCorrectBlogsFilter();
        const totalBlogsCount: number = await this.BlogModel.countDocuments(
          filter,
        );
        const additionalData: PaginationHelpersType = getPaginationHelpers({
          pageSize: rawPaginationQuery.pageSize,
          sortBy: rawPaginationQuery.sortBy,
          totalDocumentsCount: totalBlogsCount,
          pageNumber: rawPaginationQuery.pageNumber,
          sortDirection: rawPaginationQuery.sortDirection,
        });
        const foundedBlogs: Blog[] = await this.BlogModel.find(
          filter,
          { _id: false },
          {
            limit: rawPaginationQuery.pageSize,
            skip: additionalData.howMuchToSkip,
            sort: additionalData.sortQuery,
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
          pagesCount: additionalData.pagesCount,
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
    const userId: string | null = getUserId();
    const foundedBlog: Blog | null = await this.BlogModel.findOne({
      id: blogId,
      hidden: false,
    }).lean();
    if (!foundedBlog) throw new NotFoundException();
    const getPostsWithPagination =
      async (): Promise<PostApiPaginationModelType> => {
        const filter: FilterQuery<PostSchema> = { blogId, hidden: false };
        const totalPostsCount: number = await this.PostModel.countDocuments(
          filter,
        );
        const paginationHelpers: PaginationHelpersType = getPaginationHelpers({
          pageSize: rawPaginationQuery.pageSize,
          sortBy: rawPaginationQuery.sortBy,
          totalDocumentsCount: totalPostsCount,
          sortDirection: rawPaginationQuery.sortDirection,
          pageNumber: rawPaginationQuery.pageNumber,
        });
        const foundedPosts: Post[] = await this.PostModel.find(
          filter,
          { _id: false },
          {
            limit: rawPaginationQuery.pageSize,
            skip: paginationHelpers.howMuchToSkip,
            sort: paginationHelpers.sortQuery,
          },
        ).lean();
        const mappedPosts: PostApiModel[] = [];
        for (const postDocument of foundedPosts) {
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
          pagesCount: paginationHelpers.pagesCount,
          page: rawPaginationQuery.pageNumber,
          pageSize: rawPaginationQuery.pageSize,
          totalCount: totalPostsCount,
          items: mappedPosts,
        };
        return resultPostsPagination;
      };
    return getPostsWithPagination();
  }

  async getBlogById(blogId: string): Promise<BlogDocument | null> {
    return this.BlogModel.findOne(
      { id: blogId, hidden: false },
      { _id: false },
    );
  }
}
