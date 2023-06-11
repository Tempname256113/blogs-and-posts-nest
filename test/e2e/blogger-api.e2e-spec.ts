import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import request, { Response } from 'supertest';
import { UserApiCreateDto } from '../../src/admin-api/user/api/models/user-api.dto';
import { BlogBloggerApiModel } from '../../src/blogger-api/blog/api/models/blog-blogger-api.models';
import {
  BlogBloggerApiCreateUpdateDTO,
  BloggerApiCreateUpdatePostDTO,
} from '../../src/blogger-api/blog/api/models/blog-blogger-api.dto';
import {
  PostApiModel,
  PostNewestLikeType,
} from '../../src/public-api/post/api/models/post-api.models';
import { PostApiCreateUpdateDTO } from '../../src/public-api/post/api/models/post-api.dto';

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

  const userAccessTokens: {
    user1AccessToken: string;
    user2AccessToken: string;
    user3AccessToken: string;
  } = {
    user1AccessToken: '',
    user2AccessToken: '',
    user3AccessToken: '',
  };

  // созданы по 2 блога для каждого пользователя
  const usersCreatedBlogs: {
    user1Blogs: BlogBloggerApiModel[];
    user2Blogs: BlogBloggerApiModel[];
    user3Blogs: BlogBloggerApiModel[];
  } = {
    user1Blogs: [],
    user2Blogs: [],
    user3Blogs: [],
  };

  /* 1 пользователь === 1 пост
   * 2 пользователь === 2 поста
   * 3 пользователь === 3 поста */
  const usersCreatedPosts: {
    user1Posts: PostApiModel[];
    user2Posts: PostApiModel[];
    user3Posts: PostApiModel[];
  } = {
    user1Posts: [],
    user2Posts: [],
    user3Posts: [],
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
        userAccessTokens[`user${i + 1}AccessToken`] =
          responseWithAccessToken.body.accessToken;
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

      const userCreateBlogRequest = async ({
        createBlogDTOIndex,
        userAccessTokenIndex,
      }: {
        userAccessTokenIndex: number;
        createBlogDTOIndex: number;
      }): Promise<BlogBloggerApiModel> => {
        const response: Response = await request(app.getHttpServer())
          .post('/blogger/blogs')
          .auth(userAccessTokens[`user${userAccessTokenIndex}AccessToken`], {
            type: 'bearer',
          })
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
        const user1Blog: BlogBloggerApiModel = await userCreateBlogRequest({
          userAccessTokenIndex: 1,
          createBlogDTOIndex: i,
        });
        const user2Blog: BlogBloggerApiModel = await userCreateBlogRequest({
          userAccessTokenIndex: 2,
          createBlogDTOIndex: i,
        });
        const user3Blog: BlogBloggerApiModel = await userCreateBlogRequest({
          userAccessTokenIndex: 3,
          createBlogDTOIndex: i,
        });
        usersCreatedBlogs.user1Blogs.push(user1Blog);
        usersCreatedBlogs.user2Blogs.push(user2Blog);
        usersCreatedBlogs.user3Blogs.push(user3Blog);
      }
    });
  });

  describe('blogger api creating new posts', () => {
    it('POST(/blogger/blogs/:blogId/posts), create new post, should return status 201 and new created post', async () => {
      const newPostsDTOArray: BloggerApiCreateUpdatePostDTO[] = [
        {
          title: '123',
          shortDescription: 'description',
          content: 'post content',
        },
        {
          title: '321',
          shortDescription: 'description321',
          content: 'content post',
        },
      ];

      const getCorrectCreatedPost = ({
        title,
        shortDescription,
        content,
        blogId,
        blogName,
      }: {
        title: string;
        shortDescription: string;
        content: string;
        blogId: string;
        blogName: string;
      }): PostApiModel => {
        const correctCreatedPost: PostApiModel = {
          id: expect.any(String),
          title,
          shortDescription,
          content,
          blogId,
          blogName,
          createdAt: expect.any(String),
          extendedLikesInfo: {
            likesCount: 0,
            dislikesCount: 0,
            myStatus: 'None',
            newestLikes: [],
          },
        };
        return correctCreatedPost;
      };

      const userCreatePostRequest = async ({
        blog,
        createPostDTOIndex,
        userAccessToken,
      }: {
        blog: BlogBloggerApiModel;
        createPostDTOIndex: number;
        userAccessToken: string;
      }): Promise<PostApiModel> => {
        const response: Response = await request(app.getHttpServer())
          .post(`/blogger/blogs/${blog.id}/posts`)
          .auth(userAccessToken, { type: 'bearer' })
          .send(newPostsDTOArray[createPostDTOIndex])
          .expect(201);
        expect(response.body).toStrictEqual(
          getCorrectCreatedPost({
            title: newPostsDTOArray[createPostDTOIndex].title,
            shortDescription:
              newPostsDTOArray[createPostDTOIndex].shortDescription,
            content: newPostsDTOArray[createPostDTOIndex].content,
            blogId: blog.id,
            blogName: blog.name,
          }),
        );
        return response.body;
      };

      const createPostsByUser1 = async (): Promise<void> => {
        const newPost: PostApiModel = await userCreatePostRequest({
          blog: usersCreatedBlogs.user1Blogs[0],
          createPostDTOIndex: 0,
          userAccessToken: userAccessTokens.user1AccessToken,
        });
        usersCreatedPosts.user1Posts.push(newPost);
      };

      const createPostsByUser2 = async (): Promise<void> => {
        for (let i = 0; i < 2; i++) {
          const newPost: PostApiModel = await userCreatePostRequest({
            blog: usersCreatedBlogs.user2Blogs[i],
            createPostDTOIndex: i,
            userAccessToken: userAccessTokens.user2AccessToken,
          });
          usersCreatedPosts.user2Posts.push(newPost);
        }
      };

      const createPostsByUser3 = async (): Promise<void> => {
        const newPost: PostApiModel = await userCreatePostRequest({
          blog: usersCreatedBlogs.user3Blogs[0],
          createPostDTOIndex: 1,
          userAccessToken: userAccessTokens.user3AccessToken,
        });
        usersCreatedPosts.user3Posts.push(newPost);
        for (let i = 0; i < 2; i++) {
          const newPost: PostApiModel = await userCreatePostRequest({
            blog: usersCreatedBlogs.user3Blogs[i],
            createPostDTOIndex: i,
            userAccessToken: userAccessTokens.user3AccessToken,
          });
          usersCreatedPosts.user3Posts.push(newPost);
        }
      };

      await createPostsByUser1();
      await createPostsByUser2();
      await createPostsByUser3();
    });
  });
});
