import { UserApiCreateDto } from '../../../src/admin-api/user/api/models/user-api.dto';
import { UserViewModel } from '../../../src/admin-api/user/api/models/user-api.models';
import { INestApplication } from '@nestjs/common';
import {
  createUserTestFactoryFunction,
  newTestUsersCreateDTO,
} from '../../../test-utils/create-user.test-factory-function';
import { BlogBloggerApiViewModel } from '../../../src/blogger-api/blog/api/models/blog-blogger-api.models';
import { PostViewModel } from '../../../src/public-api/post/api/models/post-api.models';
import request, { Response } from 'supertest';
import { loginUserTestFunction } from '../../../test-utils/login-user.test-function';
import { createBlogTestFactoryFunction } from '../../../test-utils/create-blog.test-factory-function';
import { createPostTestFactoryFunction } from '../../../test-utils/create-post.test-factory-function';
import { CommentViewModel } from '../../../src/public-api/comment/api/models/comment-api.models';
import { createCommentTestFactoryFunction } from '../../../test-utils/create-comment.test-factory-function';
import { BanBlogAdminApiDTO } from '../../../src/admin-api/blog/api/models/blog-admin-api.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';

type UserTestType = Partial<{
  accessToken: string;
  credentials: UserApiCreateDto;
  createdUserResponse: UserViewModel;
}>;

describe('admin api blog ban functionality test', () => {
  let app: INestApplication;
  let httpServer: any;

  const blogger: UserTestType = { credentials: newTestUsersCreateDTO.user1 };
  let createdBlog: BlogBloggerApiViewModel;
  let createdPost: PostViewModel;
  let createdComment: CommentViewModel;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();

    const createUser = async () => {
      const response: Response = await createUserTestFactoryFunction({
        httpServer,
        userCreateDTO: blogger.credentials,
      });
      const createdUser: UserViewModel = response.body;
      blogger.createdUserResponse = createdUser;
    };
    const userLogin = async () => {
      const response: Response = await loginUserTestFunction({
        httpServer,
        loginUserDTO: {
          loginOrEmail: blogger.credentials.login,
          password: blogger.credentials.password,
        },
      });
      const accessToken: string = response.body.accessToken;
      blogger.accessToken = accessToken;
    };
    const createBlog = async () => {
      const response: Response = await createBlogTestFactoryFunction({
        httpServer,
        userAccessToken: blogger.accessToken,
      });
      const newCreatedBlog: BlogBloggerApiViewModel = response.body;
      createdBlog = newCreatedBlog;
    };
    const createPost = async () => {
      const response: Response = await createPostTestFactoryFunction({
        httpServer,
        blogId: createdBlog.id,
        userAccessToken: blogger.accessToken,
      });
      const newCreatedPost: PostViewModel = response.body;
      createdPost = newCreatedPost;
    };
    const createComment = async () => {
      const response: Response = await createCommentTestFactoryFunction({
        httpServer,
        userAccessToken: blogger.accessToken,
        postId: createdPost.id,
      });
      const newCreatedComment: CommentViewModel = response.body;
      createdComment = newCreatedComment;
    };
    await createUser();
    await userLogin();
    await createBlog();
    await createPost();
    await createComment();
  });

  afterAll(async () => {
    await app.close();
  });

  const banBlog = async (isBanned: boolean) => {
    const login = 'admin';
    const pass = 'qwerty';
    const banBlogDTO: BanBlogAdminApiDTO = {
      isBanned,
    };
    await request(httpServer)
      .put(`/sa/blogs/${createdBlog.id}/ban`)
      .auth(login, pass, { type: 'basic' })
      .send(banBlogDTO)
      .expect(204);
  };

  const getAllEntities = async (expectedStatus: number): Promise<void> => {
    await request(httpServer)
      .get(`/blogs/${createdBlog.id}`)
      .expect(expectedStatus);
    await request(httpServer)
      .get(`/posts/${createdPost.id}`)
      .expect(expectedStatus);
    await request(httpServer)
      .get(`/comments/${createdComment.id}`)
      .expect(expectedStatus);
  };

  it('admin api PUT(/sa/blogs/:blogId/ban) should ban blog and return status 204', async () => {
    await banBlog(true);
  });

  it('try get all banned entities (blog, post, comment) by public api. should return 404 statuses', async () => {
    await getAllEntities(404);
  });

  it('admin api PUT(/sa/blogs/:blogId/ban) should unban blog and return status 204', async () => {
    await banBlog(false);
  });

  it('try get all unbanned entities(blog, post, comment) by public api. should return 200 statuses', async () => {
    await getAllEntities(200);
  });
});
