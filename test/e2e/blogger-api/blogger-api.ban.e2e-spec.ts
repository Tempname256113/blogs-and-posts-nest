import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import { UserApiCreateDto } from '../../../src/admin-api/user/api/models/user-api.dto';
import { UserViewModel } from '../../../src/admin-api/user/api/models/user-api.models';
import {
  BannedUserBloggerApiPaginationViewModel,
  BannedUserBloggerApiViewModel,
  BlogBloggerApiViewModel,
} from '../../../src/blogger-api/blog/api/models/blog-blogger-api.models';
import { PostViewModel } from '../../../src/public-api/post/api/models/post-api.models';
import {
  createUserTestFactoryFunction,
  newTestUsersCreateDTO,
} from '../../../test-utils/create-user.test-factory-function';
import request, { Response } from 'supertest';
import { loginUserTestFunction } from '../../../test-utils/login-user.test-function';
import { createPostTestFactoryFunction } from '../../../test-utils/create-post.test-factory-function';
import { createBlogTestFactoryFunction } from '../../../test-utils/create-blog.test-factory-function';
import { createCommentTestFactoryFunction } from '../../../test-utils/create-comment.test-factory-function';
import { CommentViewModel } from '../../../src/public-api/comment/api/models/comment-api.models';
import { BanUserBloggerApiDTO } from '../../../src/blogger-api/blog/api/models/blog-blogger-api.dto';

type UserTestType = Partial<{
  accessToken: string;
  credentials: UserApiCreateDto;
  createdUserResponse: UserViewModel;
}>;

describe('blogger api ban functionality tests', () => {
  let app: INestApplication;
  let httpServer: any;

  const user1: UserTestType = { credentials: newTestUsersCreateDTO.user1 };
  const user2: UserTestType = { credentials: newTestUsersCreateDTO.user2 };
  const blogger: UserTestType = { credentials: newTestUsersCreateDTO.user3 };
  let bloggerBlog: BlogBloggerApiViewModel;
  let bloggerPost: PostViewModel;
  let banUserBloggerApiDTO: BanUserBloggerApiDTO;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();

    const allUsersArray: UserTestType[] = [user1, user2, blogger];
    const createUsers = async () => {
      for (let i = 0; i < allUsersArray.length; i++) {
        const response: Response = await createUserTestFactoryFunction({
          httpServer,
          userCreateDTO: allUsersArray[i].credentials,
        });
        const createdUser: UserViewModel = response.body;
        allUsersArray[i].createdUserResponse = createdUser;
      }
    };
    const loginUsers = async () => {
      for (let i = 0; i < allUsersArray.length; i++) {
        const response: Response = await loginUserTestFunction({
          httpServer,
          loginUserDTO: {
            loginOrEmail: allUsersArray[i].credentials.login,
            password: allUsersArray[i].credentials.password,
          },
        });
        const accessToken: string = response.body.accessToken;
        allUsersArray[i].accessToken = accessToken;
      }
    };
    const createBlog = async () => {
      const response: Response = await createBlogTestFactoryFunction({
        httpServer,
        userAccessToken: blogger.accessToken,
      });
      const createdBlog: BlogBloggerApiViewModel = response.body;
      bloggerBlog = createdBlog;
      banUserBloggerApiDTO = {
        isBanned: true,
        banReason: 'test ban reason dwadwwdawadwadwadwdawadwadwadadw',
        blogId: bloggerBlog.id,
      };
    };
    const createPost = async () => {
      const response: Response = await createPostTestFactoryFunction({
        httpServer,
        userAccessToken: blogger.accessToken,
        blogId: bloggerBlog.id,
      });
      const createdPost: PostViewModel = response.body;
      bloggerPost = createdPost;
    };
    await createUsers();
    await loginUsers();
    await createBlog();
    await createPost();
  });

  afterAll(async () => {
    await app.close();
  });

  const createCommentWithResponseCheck = async (user: UserTestType) => {
    const response: Response = await createCommentTestFactoryFunction({
      httpServer,
      userAccessToken: user.accessToken,
      postId: bloggerPost.id,
    });
    expect(response.status).toBe(201);
    expect(response.body).toEqual<CommentViewModel>({
      id: expect.any(String),
      content: expect.any(String),
      createdAt: expect.any(String),
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
      },
      commentatorInfo: {
        userId: user.createdUserResponse.id,
        userLogin: user.createdUserResponse.login,
      },
    });
  };

  it('public api POST(/posts/:postId/comments) should create new comment, success response status 201 and comment model', async () => {
    await createCommentWithResponseCheck(user1);
  });

  it('blogger api PUT(/blogger/users/:userId/ban) should ban user, success response, status 204 ', async () => {
    const usersForBanArray: UserTestType[] = [user1, user2];
    for (let i = 0; i < usersForBanArray.length; i++) {
      const userIdForBan: string = usersForBanArray[i].createdUserResponse.id;
      await request(httpServer)
        .put(`/blogger/users/${userIdForBan}/ban`)
        .auth(blogger.accessToken, { type: 'bearer' })
        .send(banUserBloggerApiDTO)
        .expect(204);
    }
  });

  it('public api POST(/posts/:postId/comments) try create comment by banned user. failed response, status 403', async () => {
    const bannedUsersArray: UserTestType[] = [user1, user2];
    for (let i = 0; i < bannedUsersArray.length; i++) {
      const response: Response = await createCommentTestFactoryFunction({
        httpServer,
        userAccessToken: bannedUsersArray[i].accessToken,
        postId: bloggerPost.id,
      });
      expect(response.status).toBe(403);
    }
  });

  describe('tests with banned users', () => {
    it('blogger api GET(/blogger/users/blog/:blogId) should return banned users for blog. success response, status 200', async () => {
      const getAllBannedUsers = async () => {
        const bannedUsersArray: UserTestType[] = [user1, user2];
        const mappedBannedUsersArray: BannedUserBloggerApiViewModel[] = [];
        for (let i = 0; i < bannedUsersArray.length; i++) {
          mappedBannedUsersArray.push({
            id: bannedUsersArray[i].createdUserResponse.id,
            login: bannedUsersArray[i].createdUserResponse.login,
            banInfo: {
              isBanned: true,
              banReason: banUserBloggerApiDTO.banReason,
              banDate: expect.any(String),
            },
          });
        }
        const response: Response = await request(httpServer)
          .get(`/blogger/users/blog/${bloggerBlog.id}`)
          .auth(blogger.accessToken, { type: 'bearer' });
        expect(response.status).toBe(200);
        expect(response.body).toEqual<BannedUserBloggerApiPaginationViewModel>({
          page: 1,
          pageSize: 10,
          pagesCount: 1,
          totalCount: bannedUsersArray.length,
          items: expect.arrayContaining(mappedBannedUsersArray),
        });
      };
      await getAllBannedUsers();
    });

    it('blogger api PUT(/blogger/users/:userId/ban) should unban user, success response, status 204', async () => {
      const unbanUserByBloggerDTO: BanUserBloggerApiDTO = {
        isBanned: false,
        banReason: 'unban user. stop this and get back my user',
        blogId: bloggerBlog.id,
      };
      await request(httpServer)
        .put(`/blogger/users/${user1.createdUserResponse.id}/ban`)
        .auth(blogger.accessToken, { type: 'bearer' })
        .send(unbanUserByBloggerDTO)
        .expect(204);
    });

    it('public api POST(/posts/:postId/comments) should create new comment by unbanned user, success response status 201 and comment model', async () => {
      await createCommentWithResponseCheck(user1);
    });
  });
});
