import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import request, { Response } from 'supertest';
import { UserApiCreateDto } from '../../src/admin-api/user/api/models/user-api.dto';
import { BlogBloggerApiModel } from '../../src/blogger-api/blog/api/models/blog-blogger-api.models';
import { BlogBloggerApiCreateUpdateDTO } from '../../src/blogger-api/blog/api/models/blog-blogger-api.dto';

describe('blogger api e2e tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const usersAccessTokens: string[] = [];

  const usersCreatedBlogs: {
    user1Blogs: BlogBloggerApiModel[];
    user2Blogs: BlogBloggerApiModel[];
    user3Blogs: BlogBloggerApiModel[];
  } = {
    user1Blogs: [],
    user2Blogs: [],
    user3Blogs: [],
  };

  describe('create 3 users throgh admin api', () => {
    const newUsersArrayCreateDTO: UserApiCreateDto[] = [
      {
        login: 'temp123',
        password: 'temp123',
        email: 'temp256113@mail.ru',
      },
      {
        login: 'sashok228',
        password: 'sashok228',
        email: 'temp256113@mail.ru',
      },
      {
        login: 'kek123',
        password: 'kek123',
        email: 'temp256113@mail.ru',
      },
    ];

    it('admin api POST(/sa/users) should create new users. success response, 201 status', async () => {
      const basicAuthLogin = 'admin';
      const basicAuthPass = 'qwerty';
      for (let i = 0; i < newUsersArrayCreateDTO.length; i++) {
        await request(app.getHttpServer())
          .post('/sa/users')
          .auth(basicAuthLogin, basicAuthPass, { type: 'basic' })
          .send(newUsersArrayCreateDTO[i])
          .expect(201);
      }
    });

    it('public api POST(/auth/login) users login. should return access token and status 200', async () => {
      for (let i = 0; i < newUsersArrayCreateDTO.length; i++) {
        const responseWithAccessToken: Response = await request(
          app.getHttpServer(),
        )
          .post('/auth/login')
          .send({
            loginOrEmail: newUsersArrayCreateDTO[i].login,
            password: newUsersArrayCreateDTO[i].password,
          })
          .expect(200);
        expect(responseWithAccessToken.body).toStrictEqual({
          accessToken: expect.any(String),
        });
        usersAccessTokens.push(responseWithAccessToken.body.accessToken);
      }
    });
  });

  describe('blogger api creating blogs by 3 users', () => {
    it('blogger api POST(/blogger/blogs) creating new blogs. should return 201 status and created blog', async () => {
      const getCorrectCreatedBlog = ({
        name,
        description,
        websiteUrl,
      }: {
        name: string;
        description: string;
        websiteUrl: string;
      }): BlogBloggerApiModel => {
        const correctCreatedBlog: BlogBloggerApiModel = {
          id: expect.any(String),
          name,
          description,
          websiteUrl,
          createdAt: expect.any(String),
          isMembership: expect.any(Boolean),
        };
        return correctCreatedBlog;
      };

      const newBlogsDTOArray: BlogBloggerApiCreateUpdateDTO[] = [
        {
          name: 'blog name',
          description: 'blog description',
          websiteUrl:
            'https://www.mongodb.com/docs/manual/tutorial/getting-started/',
        },
        {
          name: 'user11',
          description: 'user11',
          websiteUrl:
            'https://www.mongodb.com/docs/manual/tutorial/getting-started/',
        },
      ];

      const userCreateBlogsRequest = async ({
        createBlogDTOIndex,
        userAccessTokenIndex,
      }: {
        userAccessTokenIndex: number;
        createBlogDTOIndex: number;
      }): Promise<BlogBloggerApiModel> => {
        const response: Response = await request(app.getHttpServer())
          .post('/blogger/blogs')
          .auth(usersAccessTokens[userAccessTokenIndex], { type: 'bearer' })
          .send(newBlogsDTOArray[createBlogDTOIndex])
          .expect(201);
        expect(response.body).toStrictEqual(
          getCorrectCreatedBlog({
            name: newBlogsDTOArray[createBlogDTOIndex].name,
            description: newBlogsDTOArray[createBlogDTOIndex].description,
            websiteUrl: newBlogsDTOArray[createBlogDTOIndex].websiteUrl,
          }),
        );
        return response.body;
      };

      for (let i = 0; i < 2; i++) {
        const user1Blog: BlogBloggerApiModel = await userCreateBlogsRequest({
          userAccessTokenIndex: 0,
          createBlogDTOIndex: i,
        });
        usersCreatedBlogs.user1Blogs.push(user1Blog);
        const user2Blog: BlogBloggerApiModel = await userCreateBlogsRequest({
          userAccessTokenIndex: 1,
          createBlogDTOIndex: i,
        });
        usersCreatedBlogs.user2Blogs.push(user2Blog);
        const user3Blog: BlogBloggerApiModel = await userCreateBlogsRequest({
          userAccessTokenIndex: 2,
          createBlogDTOIndex: i,
        });
        usersCreatedBlogs.user3Blogs.push(user3Blog);
      }
    });
  });
});
