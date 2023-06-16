import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import request, { Response } from 'supertest';
import { UserApiCreateDto } from '../../../src/admin-api/user/api/models/user-api.dto';
import {
  BlogBloggerApiViewModel,
  CommentBloggerApiViewModel,
  CommentBloggerApiPaginationViewModel,
} from '../../../src/blogger-api/blog/api/models/blog-blogger-api.models';
import { PostViewModel } from '../../../src/public-api/post/api/models/post-api.models';
import { CommentViewModel } from '../../../src/public-api/comment/api/models/comment-api.models';
import {
  createUserTestFactoryFunction,
  newTestUsersCreateDTO,
} from '../../../test-utils/create-user.test-factory-function';
import { loginUserTestFunction } from '../../../test-utils/login-user.test-function';
import { UserViewModel } from '../../../src/admin-api/user/api/models/user-api.models';
import { createBlogTestFactoryFunction } from '../../../test-utils/create-blog.test-factory-function';
import { createPostTestFactoryFunction } from '../../../test-utils/create-post.test-factory-function';
import { createCommentTestFactoryFunction } from '../../../test-utils/create-comment.test-factory-function';

type PostTestType = Partial<{
  createdPost: PostViewModel;
  comments: Partial<{
    comment1: CommentBloggerApiViewModel;
    comment2: CommentBloggerApiViewModel;
  }>;
}>;

type BlogTestType = Partial<{
  createdBlog: BlogBloggerApiViewModel;
  posts: Partial<{
    post1: PostTestType;
    post2: PostTestType;
  }>;
}>;

type UserTestType = Partial<{
  accessToken: string;
  credentials: UserApiCreateDto;
  createdUserResponse: UserViewModel;
  blogs: Partial<{
    blog1: BlogTestType;
    blog2: BlogTestType;
  }>;
}>;

describe('blogger api e2e comments tests', () => {
  let app: INestApplication;
  let httpServer: any;
  const dataForTests: Partial<{
    user1: UserTestType;
    user2: UserTestType;
  }> = {
    user1: { credentials: newTestUsersCreateDTO.user1 },
    user2: { credentials: newTestUsersCreateDTO.user2 },
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();
    const createUser = async (user: UserTestType): Promise<void> => {
      const response: Response = await createUserTestFactoryFunction({
        httpServer,
        userCreateDTO: user.credentials,
      });
      const createdUser: UserViewModel = response.body;
      user.createdUserResponse = createdUser;
    };
    const loginUser = async (user: UserTestType): Promise<void> => {
      const response: Response = await loginUserTestFunction({
        httpServer,
        loginUserDTO: {
          loginOrEmail: user.credentials.login,
          password: user.credentials.password,
        },
      });
      const accessToken: string = response.body.accessToken;
      user.accessToken = accessToken;
    };
    const createBlogs = async (user: UserTestType): Promise<void> => {
      user.blogs = {};
      for (let i = 1; i < 3; i++) {
        const response: Response = await createBlogTestFactoryFunction({
          httpServer,
          userAccessToken: user.accessToken,
        });
        const createdBlog: BlogBloggerApiViewModel = response.body;
        user.blogs[`blog${i}`] = { createdBlog };
      }
    };
    const createPosts = async (user: UserTestType): Promise<void> => {
      const createPostsForBlog = async (blog: BlogTestType): Promise<void> => {
        blog.posts = {};
        for (let i = 1; i < 3; i++) {
          const response: Response = await createPostTestFactoryFunction({
            httpServer,
            blogId: blog.createdBlog.id,
            userAccessToken: user.accessToken,
          });
          const createdPost: PostViewModel = response.body;
          blog.posts[`post${i}`] = { createdPost };
        }
      };
      await createPostsForBlog(user.blogs.blog1);
      await createPostsForBlog(user.blogs.blog2);
    };
    const prepareInitialPostsState = async (user: UserTestType) => {
      await createUser(user);
      await loginUser(user);
      await createBlogs(user);
      await createPosts(user);
    };
    await prepareInitialPostsState(dataForTests.user1);
    await prepareInitialPostsState(dataForTests.user2);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('create comments by public api and get all existing comments by blogger api', () => {
    it('public api POST(/posts/:postId/comments) should return new comment view model and status 201', async () => {
      const checkCreateCommentResponse = ({
        createCommentResponse,
        userId,
        userLogin,
      }: {
        createCommentResponse: Response;
        userId: string;
        userLogin: string;
      }): void => {
        expect(createCommentResponse.status).toBe(201);
        expect(createCommentResponse.body).toStrictEqual<CommentViewModel>({
          id: expect.any(String),
          createdAt: expect.any(String),
          content: expect.any(String),
          commentatorInfo: {
            userId,
            userLogin,
          },
          likesInfo: {
            likesCount: 0,
            dislikesCount: 0,
            myStatus: 'None',
          },
        });
      };
      const createComments = async (user: UserTestType): Promise<void> => {
        const createCommentsForPost = async (
          post: PostTestType,
        ): Promise<void> => {
          post.comments = {};
          for (let i = 1; i < 3; i++) {
            const response: Response = await createCommentTestFactoryFunction({
              httpServer,
              userAccessToken: user.accessToken,
              postId: post.createdPost.id,
            });
            checkCreateCommentResponse({
              createCommentResponse: response,
              userLogin: user.createdUserResponse.login,
              userId: user.createdUserResponse.id,
            });
            const createdComment: CommentViewModel = response.body;
            const mappedComment: CommentBloggerApiViewModel = {
              id: createdComment.id,
              content: createdComment.content,
              commentatorInfo: {
                userId: user.createdUserResponse.id,
                userLogin: user.createdUserResponse.login,
              },
              createdAt: createdComment.createdAt,
              postInfo: {
                id: post.createdPost.id,
                title: post.createdPost.title,
                blogId: post.createdPost.blogId,
                blogName: post.createdPost.blogName,
              },
            };
            post.comments[`comment${i}`] = mappedComment;
          }
        };
        await createCommentsForPost(user.blogs.blog1.posts.post1);
        await createCommentsForPost(user.blogs.blog2.posts.post1);
        await createCommentsForPost(user.blogs.blog1.posts.post2);
        await createCommentsForPost(user.blogs.blog2.posts.post2);
      };
      await createComments(dataForTests.user1);
      await createComments(dataForTests.user2);
    });

    it('blogger api GET(/blogger/blogs/comments) should return all comments from all existing posts', async () => {
      const getAllCommentsByCurrentUser = async (
        user: UserTestType,
      ): Promise<void> => {
        const allCreatedCurrentUserComments: CommentBloggerApiViewModel[] = [];
        const response: Response = await request(httpServer)
          .get('/blogger/blogs/comments')
          .auth(user.accessToken, { type: 'bearer' })
          .expect(200);
        for (
          let currentBlogIndex = 1;
          currentBlogIndex < 3;
          currentBlogIndex++
        ) {
          for (
            let currentPostIndex = 1;
            currentPostIndex < 3;
            currentPostIndex++
          ) {
            for (
              let currentCommentIndex = 1;
              currentCommentIndex < 3;
              currentCommentIndex++
            ) {
              allCreatedCurrentUserComments.push(
                user.blogs[`blog${currentBlogIndex}`].posts[
                  `post${currentPostIndex}`
                ].comments[`comment${currentCommentIndex}`],
              );
            }
          }
        }
        expect(response.body).toEqual<CommentBloggerApiPaginationViewModel>({
          page: 1,
          pageSize: 10,
          pagesCount: 1,
          totalCount: 8,
          items: expect.arrayContaining(allCreatedCurrentUserComments),
        });
      };
      await getAllCommentsByCurrentUser(dataForTests.user1);
      await getAllCommentsByCurrentUser(dataForTests.user2);
    });
  });
});
