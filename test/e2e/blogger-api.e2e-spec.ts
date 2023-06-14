import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import request, { Response } from 'supertest';
import { UserApiCreateDto } from '../../src/admin-api/user/api/models/user-api.dto';
import {
  BlogBloggerApiViewModel,
  CommentBloggerApiViewModel,
  CommentBloggerApiPaginationViewModel,
} from '../../src/blogger-api/blog/api/models/blog-blogger-api.models';
import {
  BlogBloggerApiCreateUpdateDTO,
  PostCreateUpdateBloggerApiDTO,
} from '../../src/blogger-api/blog/api/models/blog-blogger-api.dto';
import { PostApiModel } from '../../src/public-api/post/api/models/post-api.models';
import { CommentApiModel } from '../../src/public-api/comment/api/models/comment-api.models';
import { CommentApiCreateDto } from '../../src/public-api/comment/api/models/comment-api.dto';

/*const createUsers = async (httpServer: any, body: any): UserViewModel => {
  const response = await request(httpServer)
    .post('/sa/users')
    .auth(basicAuthLogin, basicAuthPass, { type: 'basic' })
    .send(body)
    .expect(201);

  return response.body;
};*/

describe('blogger api e2e tests', () => {
  let app: INestApplication;
  // let accessToten;
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
    user1Blogs: BlogBloggerApiViewModel[];
    user2Blogs: BlogBloggerApiViewModel[];
    user3Blogs: BlogBloggerApiViewModel[];
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
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/sa/users')
          .auth(basicAuthLogin, basicAuthPass, { type: 'basic' })
          .send(newUsersArrayCreateDTO[i])
          .expect(201);
      }
    });

    it('public api POST(/auth/login) users login. should return access token and status 200', async () => {
      for (let i = 0; i < 3; i++) {
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

  describe('POST(/blogger/blogs) blogger api creating blogs by 3 users', () => {
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

    const getCorrectCreatedBlog = ({
      name,
      description,
      websiteUrl,
    }: {
      name: string;
      description: string;
      websiteUrl: string;
    }): BlogBloggerApiViewModel => {
      const correctCreatedBlog: BlogBloggerApiViewModel = {
        id: expect.any(String),
        name,
        description,
        websiteUrl,
        createdAt: expect.any(String),
        isMembership: expect.any(Boolean),
      };
      return correctCreatedBlog;
    };

    const userCreateBlogRequest = async ({
      createBlogDTO,
      userAccessToken,
    }: {
      userAccessToken: string;
      createBlogDTO: BlogBloggerApiCreateUpdateDTO;
    }): Promise<BlogBloggerApiViewModel> => {
      const response: Response = await request(app.getHttpServer())
        .post('/blogger/blogs')
        .auth(userAccessToken, {
          type: 'bearer',
        })
        .send(createBlogDTO)
        .expect(201);
      expect(response.body).toStrictEqual(
        getCorrectCreatedBlog({
          name: createBlogDTO.name,
          description: createBlogDTO.description,
          websiteUrl: createBlogDTO.websiteUrl,
        }),
      );
      return response.body;
    };

    it('creating 2 new blogs by user1. should return 201 status and created blogs', async () => {
      const blog1: BlogBloggerApiViewModel = await userCreateBlogRequest({
        userAccessToken: userAccessTokens.user1AccessToken,
        createBlogDTO: newBlogsDTOArray[0],
      });
      const blog2: BlogBloggerApiViewModel = await userCreateBlogRequest({
        userAccessToken: userAccessTokens.user1AccessToken,
        createBlogDTO: newBlogsDTOArray[1],
      });
      usersCreatedBlogs.user1Blogs.push(blog1);
      usersCreatedBlogs.user1Blogs.push(blog2);
    });

    it('creating 2 new blogs by user2. should return 201 status and created blogs', async () => {
      const blog1: BlogBloggerApiViewModel = await userCreateBlogRequest({
        userAccessToken: userAccessTokens.user2AccessToken,
        createBlogDTO: newBlogsDTOArray[0],
      });
      const blog2: BlogBloggerApiViewModel = await userCreateBlogRequest({
        userAccessToken: userAccessTokens.user2AccessToken,
        createBlogDTO: newBlogsDTOArray[1],
      });
      usersCreatedBlogs.user2Blogs.push(blog1);
      usersCreatedBlogs.user2Blogs.push(blog2);
    });

    it('creating 2 new blogs by user3. should return 201 status and created blogs', async () => {
      const blog1: BlogBloggerApiViewModel = await userCreateBlogRequest({
        userAccessToken: userAccessTokens.user3AccessToken,
        createBlogDTO: newBlogsDTOArray[0],
      });
      const blog2: BlogBloggerApiViewModel = await userCreateBlogRequest({
        userAccessToken: userAccessTokens.user3AccessToken,
        createBlogDTO: newBlogsDTOArray[1],
      });
      usersCreatedBlogs.user3Blogs.push(blog1);
      usersCreatedBlogs.user3Blogs.push(blog2);
    });
  });

  describe('POST(/blogger/blogs/:blogId/posts) blogger api creating new posts', () => {
    const newPostsDTOArray: PostCreateUpdateBloggerApiDTO[] = [
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
      createPostDTO,
      userAccessToken,
    }: {
      blog: BlogBloggerApiViewModel;
      createPostDTO: PostCreateUpdateBloggerApiDTO;
      userAccessToken: string;
    }): Promise<PostApiModel> => {
      const response: Response = await request(app.getHttpServer())
        .post(`/blogger/blogs/${blog.id}/posts`)
        .auth(userAccessToken, { type: 'bearer' })
        .send(createPostDTO)
        .expect(201);
      expect(response.body).toStrictEqual(
        getCorrectCreatedPost({
          title: createPostDTO.title,
          shortDescription: createPostDTO.shortDescription,
          content: createPostDTO.content,
          blogId: blog.id,
          blogName: blog.name,
        }),
      );
      return response.body;
    };

    it('create new post by user1, should return status 201 and new created post', async () => {
      const newPost: PostApiModel = await userCreatePostRequest({
        blog: usersCreatedBlogs.user1Blogs[0],
        createPostDTO: newPostsDTOArray[0],
        userAccessToken: userAccessTokens.user1AccessToken,
      });
      usersCreatedPosts.user1Posts.push(newPost);
    });

    it('create 2 new posts by user2, should return status 201 and new created posts', async () => {
      for (let i = 0; i < 2; i++) {
        const newPost: PostApiModel = await userCreatePostRequest({
          blog: usersCreatedBlogs.user2Blogs[i],
          createPostDTO: newPostsDTOArray[i],
          userAccessToken: userAccessTokens.user2AccessToken,
        });
        usersCreatedPosts.user2Posts.push(newPost);
      }
    });

    it('create 3 new posts by user3, should return status 201 and new created posts', async () => {
      const newPost: PostApiModel = await userCreatePostRequest({
        blog: usersCreatedBlogs.user3Blogs[0],
        createPostDTO: newPostsDTOArray[1],
        userAccessToken: userAccessTokens.user3AccessToken,
      });
      usersCreatedPosts.user3Posts.push(newPost);
      for (let i = 0; i < 2; i++) {
        const newPost: PostApiModel = await userCreatePostRequest({
          blog: usersCreatedBlogs.user3Blogs[i],
          createPostDTO: newPostsDTOArray[i],
          userAccessToken: userAccessTokens.user3AccessToken,
        });
        usersCreatedPosts.user3Posts.push(newPost);
      }
    });
  });

  describe('public api creating new comments and get all comments by blogger api', () => {
    /*  1 пользователь === 3 коммента
     *  2 пользователь === 6 комментов
     *  3 пользователь === 9 комментов
     *  по 3 коммента на один пост */
    const usersCreatedComments: {
      user1Comments: CommentApiModel[];
      user2Comments: CommentApiModel[];
      user3Comments: CommentApiModel[];
    } = {
      user1Comments: [],
      user2Comments: [],
      user3Comments: [],
    };

    const newCommentsDTOArray: CommentApiCreateDto[] = [
      { content: 'comment1' },
      { content: 'comment2' },
      { content: 'comment3' },
    ];

    describe('POST (/posts/:postId/comments) public api, creating new comments', () => {
      const getCorrectCreatedComment = ({
        content,
      }: {
        content: string;
      }): CommentApiModel => {
        const correctCreatedComment: CommentApiModel = {
          id: expect.any(String),
          content,
          commentatorInfo: {
            userId: expect.any(String),
            userLogin: expect.any(String),
          },
          createdAt: expect.any(String),
          likesInfo: {
            likesCount: 0,
            dislikesCount: 0,
            myStatus: 'None',
          },
        };
        return correctCreatedComment;
      };

      const userCreateCommentRequest = async ({
        createCommentDTO,
        userAccessToken,
        postId,
      }: {
        createCommentDTO: CommentApiCreateDto;
        userAccessToken: string;
        postId: string;
      }): Promise<CommentApiModel> => {
        const response: Response = await request(app.getHttpServer())
          .post(`/posts/${postId}/comments`)
          .auth(userAccessToken, { type: 'bearer' })
          .send(createCommentDTO)
          .expect(201);
        expect(response.body).toStrictEqual(
          getCorrectCreatedComment({
            content: createCommentDTO.content,
          }),
        );
        return response.body;
      };

      it('creating comments for user1 post by user1, user2 and user3', async () => {
        const commentByUser1Post1: CommentApiModel =
          await userCreateCommentRequest({
            postId: usersCreatedPosts.user1Posts[0].id,
            createCommentDTO: newCommentsDTOArray[0],
            userAccessToken: userAccessTokens.user1AccessToken,
          });
        const commentByUser2Post1: CommentApiModel =
          await userCreateCommentRequest({
            postId: usersCreatedPosts.user1Posts[0].id,
            createCommentDTO: newCommentsDTOArray[1],
            userAccessToken: userAccessTokens.user2AccessToken,
          });
        const commentByUser3Post1: CommentApiModel =
          await userCreateCommentRequest({
            postId: usersCreatedPosts.user1Posts[0].id,
            createCommentDTO: newCommentsDTOArray[2],
            userAccessToken: userAccessTokens.user3AccessToken,
          });
        usersCreatedComments.user1Comments.push(commentByUser1Post1);
        usersCreatedComments.user1Comments.push(commentByUser2Post1);
        usersCreatedComments.user1Comments.push(commentByUser3Post1);
      });

      it('creating comments for user2 posts by user1, user2 and user3', async () => {
        for (let i = 0; i < 2; i++) {
          const commentByUser1: CommentApiModel =
            await userCreateCommentRequest({
              postId: usersCreatedPosts.user2Posts[i].id,
              createCommentDTO: newCommentsDTOArray[i],
              userAccessToken: userAccessTokens.user1AccessToken,
            });
          const commentByUser2: CommentApiModel =
            await userCreateCommentRequest({
              postId: usersCreatedPosts.user2Posts[1].id,
              createCommentDTO: newCommentsDTOArray[i + 1],
              userAccessToken: userAccessTokens.user2AccessToken,
            });
          const commentByUser3: CommentApiModel =
            await userCreateCommentRequest({
              postId: usersCreatedPosts.user2Posts[0].id,
              createCommentDTO: newCommentsDTOArray[i],
              userAccessToken: userAccessTokens.user3AccessToken,
            });
          usersCreatedComments.user2Comments.push(commentByUser1);
          usersCreatedComments.user2Comments.push(commentByUser2);
          usersCreatedComments.user2Comments.push(commentByUser3);
        }
      });

      it('creating comments for user3 posts by user1, user2 and user3', async () => {
        for (let i = 0; i < 3; i++) {
          const commentByUser1: CommentApiModel =
            await userCreateCommentRequest({
              postId: usersCreatedPosts.user3Posts[i].id,
              createCommentDTO: newCommentsDTOArray[i],
              userAccessToken: userAccessTokens.user1AccessToken,
            });
          const commentByUser2: CommentApiModel =
            await userCreateCommentRequest({
              postId: usersCreatedPosts.user3Posts[i].id,
              createCommentDTO: newCommentsDTOArray[i],
              userAccessToken: userAccessTokens.user2AccessToken,
            });
          const commentByUser3: CommentApiModel =
            await userCreateCommentRequest({
              postId: usersCreatedPosts.user3Posts[i].id,
              createCommentDTO: newCommentsDTOArray[i],
              userAccessToken: userAccessTokens.user3AccessToken,
            });
          usersCreatedComments.user3Comments.push(commentByUser1);
          usersCreatedComments.user3Comments.push(commentByUser2);
          usersCreatedComments.user3Comments.push(commentByUser3);
        }
      });
    });

    describe('GET (/blogger/blogs/comments) blogger api, getting all blogger comments', () => {
      it('get all comments by user1', async () => {
        const user1MappedComments: CommentBloggerApiViewModel[] =
          usersCreatedComments.user1Comments.map((comment) => {
            const mappedComment: CommentBloggerApiViewModel = {
              id: comment.id,
              content: comment.content,
              commentatorInfo: {
                userId: comment.commentatorInfo.userId,
                userLogin: comment.commentatorInfo.userLogin,
              },
              createdAt: comment.createdAt,
              postInfo: {
                id: expect.any(String),
                title: expect.any(String),
                blogId: expect.any(String),
                blogName: expect.any(String),
              },
            };
            return mappedComment;
          });
        const responseWithComments: Response = await request(
          app.getHttpServer(),
        )
          .get('/blogger/blogs/comments')
          .auth(userAccessTokens.user1AccessToken, { type: 'bearer' })
          .expect(200);
        expect(
          responseWithComments.body,
        ).toEqual<CommentBloggerApiPaginationViewModel>({
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: user1MappedComments.length,
          items: user1MappedComments,
        });
      });

      it('get all comments by user2', async () => {
        const user2MappedComments: CommentBloggerApiViewModel[] =
          usersCreatedComments.user2Comments.map((comment) => {
            const mappedComment: CommentBloggerApiViewModel = {
              id: comment.id,
              content: comment.content,
              commentatorInfo: {
                userId: comment.commentatorInfo.userId,
                userLogin: comment.commentatorInfo.userLogin,
              },
              createdAt: comment.createdAt,
              postInfo: {
                id: expect.any(String),
                title: expect.any(String),
                blogId: expect.any(String),
                blogName: expect.any(String),
              },
            };
            return mappedComment;
          });
        const responseWithComments: Response = await request(
          app.getHttpServer(),
        )
          .get('/blogger/blogs/comments')
          .auth(userAccessTokens.user2AccessToken, { type: 'bearer' })
          .expect(200);
        expect(
          responseWithComments.body,
        ).toEqual<CommentBloggerApiPaginationViewModel>({
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: user2MappedComments.length,
          items: user2MappedComments,
        });
      });

      it('get all comments by user3', async () => {
        const user3MappedComments: CommentBloggerApiViewModel[] =
          usersCreatedComments.user3Comments.map((comment) => {
            const mappedComment: CommentBloggerApiViewModel = {
              id: comment.id,
              content: comment.content,
              commentatorInfo: {
                userId: comment.commentatorInfo.userId,
                userLogin: comment.commentatorInfo.userLogin,
              },
              createdAt: comment.createdAt,
              postInfo: {
                id: expect.any(String),
                title: expect.any(String),
                blogId: expect.any(String),
                blogName: expect.any(String),
              },
            };
            return mappedComment;
          });
        const responseWithComments: Response = await request(
          app.getHttpServer(),
        )
          .get('/blogger/blogs/comments')
          .auth(userAccessTokens.user3AccessToken, { type: 'bearer' })
          .expect(200);
        expect(
          responseWithComments.body,
        ).toEqual<CommentBloggerApiPaginationViewModel>({
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: user3MappedComments.length,
          items: user3MappedComments,
        });
      });
    });
  });
});
