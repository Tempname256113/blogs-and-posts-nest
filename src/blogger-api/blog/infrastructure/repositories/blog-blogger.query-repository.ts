import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Blog,
  BlogDocument,
  BlogSchema,
} from '../../../../../libs/db/mongoose/schemes/blog.entity';
import { FilterQuery, Model } from 'mongoose';
import {
  getPaginationUtils,
  PaginationUtilsType,
} from '../../../../modules/product/product-additional/get-documents-with-pagination.func';
import {
  Post,
  PostDocument,
  PostSchema,
} from '../../../../../libs/db/mongoose/schemes/post.entity';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { Like } from '../../../../../libs/db/mongoose/schemes/like.entity';
import { EntityLikesCountType } from '../../../../public-api/like/application/models/entity-likes-count.model';
import { LikeQueryRepository } from '../../../../public-api/like/infrastructure/repositories/like.query-repository';
import { PostApiPaginationQueryDTO } from '../../../../public-api/post/api/models/post-api.query-dto';
import {
  PostApiModel,
  PostApiPaginationModelType,
  PostNewestLikeType,
} from '../../../../public-api/post/api/models/post-api.models';
import {
  BlogBloggerApiPaginationQueryDTO,
  CommentBloggerApiPaginationQueryDTO,
  BannedUsersBloggerApiPaginationQueryDTO,
} from '../../api/models/blog-blogger-api.query-dto';
import {
  BlogBloggerApiViewModel,
  BlogBloggerApiPaginationViewModel,
  CommentBloggerApiViewModel,
  CommentBloggerApiPaginationViewModel,
  BannedUserBloggerApiPaginationViewModel,
  BannedUserBloggerApiViewModel,
} from '../../api/models/blog-blogger-api.models';
import {
  Comment,
  CommentSchema,
} from '../../../../../libs/db/mongoose/schemes/comment.entity';
import {
  BannedUserByBlogger,
  BannedUserByBloggerSchema,
} from '../../../../../libs/db/mongoose/schemes/banned-user-by-blogger.entity';

@Injectable()
export class BlogBloggerQueryRepository {
  constructor(
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    @InjectModel(CommentSchema.name) private CommentModel: Model<CommentSchema>,
    @InjectModel(BannedUserByBloggerSchema.name)
    private BannedUserByBloggerModel: Model<BannedUserByBloggerSchema>,
    private likeQueryRepository: LikeQueryRepository,
    private jwtHelpers: JwtUtils,
  ) {}

  async getBlogsWithPagination({
    rawPaginationQuery,
    accessToken,
  }: {
    rawPaginationQuery: BlogBloggerApiPaginationQueryDTO;
    accessToken: string;
  }): Promise<BlogBloggerApiPaginationViewModel> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtHelpers.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const bloggerId: string = accessTokenPayload.userId;
    const blogsWithPagination =
      async (): Promise<BlogBloggerApiPaginationViewModel> => {
        let filter: FilterQuery<BlogSchema>;
        const getCorrectBlogsFilter = (): void => {
          if (!rawPaginationQuery.searchNameTerm) {
            filter = { bloggerId, hidden: false };
          } else {
            filter = {
              bloggerId,
              name: {
                $regex: rawPaginationQuery.searchNameTerm,
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
        const additionalPaginationData: PaginationUtilsType =
          getPaginationUtils({
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
            skip: additionalPaginationData.howMuchToSkip,
            sort: additionalPaginationData.sortQuery,
          },
        ).lean();
        const mappedBlogs: BlogBloggerApiViewModel[] = foundedBlogs.map(
          (blogFromDB) => {
            const mappedBlog: BlogBloggerApiViewModel = {
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
        const paginationBlogsResult: BlogBloggerApiPaginationViewModel = {
          pagesCount: additionalPaginationData.pagesCount,
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
    rawPaginationQuery: PostApiPaginationQueryDTO;
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
        const paginationHelpers: PaginationUtilsType = getPaginationUtils({
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

  async getAllCommentsFromAllPosts({
    paginationQuery,
    accessToken,
  }: {
    paginationQuery: CommentBloggerApiPaginationQueryDTO;
    accessToken: string;
  }): Promise<CommentBloggerApiPaginationViewModel> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtHelpers.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const userId: string = accessTokenPayload.userId;
    const foundedPosts: Post[] = await this.PostModel.find({
      bloggerId: userId,
      hidden: false,
    }).lean();
    const mappedCommentsToClient: CommentBloggerApiViewModel[] = [];
    for (const post of foundedPosts) {
      const foundedComments: Comment[] = await this.CommentModel.find({
        postId: post.id,
        hidden: false,
      }).lean();
      const mappedComments: CommentBloggerApiViewModel[] = foundedComments.map(
        (comment) => {
          const mappedComment: CommentBloggerApiViewModel = {
            id: comment.id,
            content: comment.content,
            commentatorInfo: {
              userId: comment.userId,
              userLogin: comment.userLogin,
            },
            createdAt: comment.createdAt,
            postInfo: {
              id: post.id,
              title: post.title,
              blogId: post.blogId,
              blogName: post.blogName,
            },
          };
          return mappedComment;
        },
      );
      mappedCommentsToClient.push(...mappedComments);
    }
    const allCommentsCount: number = mappedCommentsToClient.length;
    const additionalPaginationData: PaginationUtilsType = getPaginationUtils({
      pageSize: paginationQuery.pageSize,
      sortBy: paginationQuery.sortBy,
      totalDocumentsCount: allCommentsCount,
      pageNumber: paginationQuery.pageNumber,
      sortDirection: paginationQuery.sortDirection,
    });
    mappedCommentsToClient.sort((a, b) => {
      return a.createdAt.localeCompare(b.createdAt);
    });
    const correctCountOfComments: CommentBloggerApiViewModel[] = [];
    for (
      let i = additionalPaginationData.howMuchToSkip;
      i < mappedCommentsToClient.length;
      i++
    ) {
      correctCountOfComments.push(mappedCommentsToClient[i]);
      if (
        i ===
        additionalPaginationData.howMuchToSkip + paginationQuery.pageSize - 1
      ) {
        break;
      }
    }
    const paginationResult: CommentBloggerApiPaginationViewModel = {
      pagesCount: additionalPaginationData.pagesCount,
      page: paginationQuery.pageNumber,
      pageSize: paginationQuery.pageSize,
      totalCount: allCommentsCount,
      items: mappedCommentsToClient,
    };
    return paginationResult;
  }

  async getAllBannedUsersForBlog({
    paginationQuery,
    blogId,
  }: {
    paginationQuery: BannedUsersBloggerApiPaginationQueryDTO;
    blogId: string;
  }): Promise<BannedUserBloggerApiPaginationViewModel> {
    const filter: FilterQuery<BannedUserByBloggerSchema> = { blogId };
    if (paginationQuery.searchLoginTerm) {
      filter.userLogin = {
        $regex: paginationQuery.searchLoginTerm,
        $options: 'i',
      };
    }
    const allBannedUsersForBlogQuantity: number =
      await this.BannedUserByBloggerModel.countDocuments(filter);
    const paginationUtils: PaginationUtilsType = getPaginationUtils({
      pageSize: paginationQuery.pageSize,
      sortBy: paginationQuery.sortBy,
      sortDirection: paginationQuery.sortDirection,
      pageNumber: paginationQuery.pageNumber,
      totalDocumentsCount: allBannedUsersForBlogQuantity,
    });
    const allBannedUsersForBlog: BannedUserByBlogger[] =
      await this.BannedUserByBloggerModel.find(
        filter,
        { _id: false },
        {
          limit: paginationQuery.pageSize,
          skip: paginationUtils.howMuchToSkip,
          sort: paginationUtils.sortQuery,
        },
      );
    const mappedBannedUsersForBlog: BannedUserBloggerApiViewModel[] =
      allBannedUsersForBlog.map((user) => {
        const mappedUser: BannedUserBloggerApiViewModel = {
          id: user.userId,
          login: user.userLogin,
          banInfo: {
            isBanned: true,
            banDate: user.banDate,
            banReason: user.banReason,
          },
        };
        return mappedUser;
      });
    const paginationResult: BannedUserBloggerApiPaginationViewModel = {
      pagesCount: paginationUtils.pagesCount,
      page: paginationQuery.pageNumber,
      pageSize: paginationQuery.pageSize,
      totalCount: allBannedUsersForBlogQuantity,
      items: mappedBannedUsersForBlog,
    };
    return paginationResult;
  }

  async getBlogById(blogId: string): Promise<BlogDocument | null> {
    return this.BlogModel.findOne(
      { id: blogId, hidden: false },
      { _id: false },
    );
  }

  async getRawPostById(postId: string): Promise<PostDocument | null> {
    return this.PostModel.findOne(
      {
        id: postId,
        hidden: false,
      },
      { _id: false },
    );
  }
}
