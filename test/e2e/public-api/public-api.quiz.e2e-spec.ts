import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import {
  createUserTestFactoryFunction,
  newTestUsersCreateDTO,
} from '../../../test-utils/create-user.test-factory-function';
import { AppModule } from '../../../src/app.module';
import request from 'supertest';

const { user1: user1Credentials, user2: user2Credentials } =
  newTestUsersCreateDTO;

let user1AccessToken: string;
let user2AccessToken: string;

const basicAuthLogin = 'admin';
const basicAuthPass = 'qwerty';

const questionsId: string[] = [];

describe('public api quiz functionality tests', () => {
  let app: INestApplication;
  let httpServer: any;
  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();
  }, 20000);

  afterAll(async () => {
    await app.close();
  });

  it('DELETE -> /testing/all-data', async () => {
    await request(httpServer).delete('/testing/all-data').expect(204);
  });

  it('POST -> /sa/users', async () => {
    await createUserTestFactoryFunction({
      httpServer,
      userCreateDTO: user1Credentials,
    });
    await createUserTestFactoryFunction({
      httpServer,
      userCreateDTO: user2Credentials,
    });
  });

  it('POST -> /auth/login', async () => {
    const user1AccessTokenResponse = await request(httpServer)
      .post('/auth/login')
      .send({
        loginOrEmail: user1Credentials.login,
        password: user1Credentials.password,
      })
      .expect(200);
    expect(user1AccessTokenResponse.body).toEqual<{ accessToken: string }>({
      accessToken: expect.any(String),
    });
    const user2AccessTokenResponse = await request(httpServer)
      .post('/auth/login')
      .send({
        loginOrEmail: user2Credentials.login,
        password: user2Credentials.password,
      })
      .expect(200);
    expect(user2AccessTokenResponse.body).toEqual<{ accessToken: string }>({
      accessToken: expect.any(String),
    });
    user1AccessToken = user1AccessTokenResponse.body.accessToken;
    user2AccessToken = user2AccessTokenResponse.body.accessToken;
  });

  it('POST -> /sa/quiz/questions', async () => {
    for (let i = 1; i <= 5; i++) {
      const response = await request(httpServer)
        .post('/sa/quiz/questions')
        .auth(basicAuthLogin, basicAuthPass, { type: 'basic' })
        .send({ body: 'question', correctAnswers: ['correct answer'] })
        .expect(201);
      questionsId.push(response.body.id);
    }
  });

  it('PUT -> /sa/quiz/questions/:questionId/publish', async () => {
    for (const questionId of questionsId) {
      await request(httpServer)
        .put(`/sa/quiz/questions/${questionId}/publish`)
        .auth(basicAuthLogin, basicAuthPass, { type: 'basic' })
        .send({ published: true })
        .expect(204);
    }
  });

  it('POST -> /pair-game-quiz/pairs/connection', async () => {
    await request(httpServer)
      .post('/pair-game-quiz/pairs/connection')
      .auth(user1AccessToken, { type: 'bearer' })
      .expect(200);
    await request(httpServer)
      .post('/pair-game-quiz/pairs/connection')
      .auth(user2AccessToken, { type: 'bearer' })
      .expect(200);
  });

  it('POST -> /pair-game-quiz/pairs/my-current/answers', async () => {
    for (let i = 0; i < questionsId.length; i++) {
      await request(httpServer)
        .post('/pair-game-quiz/pairs/my-current/answers')
        .auth(user1AccessToken, { type: 'bearer' })
        .send({ answer: 'correctAnswer1' })
        .expect(200);
      await request(httpServer)
        .post('/pair-game-quiz/pairs/my-current/answers')
        .auth(user2AccessToken, { type: 'bearer' })
        .send({ answer: 'correctAnswer1' })
        .expect(200);
    }
  }, 20000);

  it('GET -> /pair-game-quiz/pairs/my-current. should return status 404', async () => {
    await request(httpServer)
      .get('/pair-game-quiz/pairs/my-current')
      .auth(user1AccessToken, { type: 'bearer' })
      .expect(404);
  });
});
