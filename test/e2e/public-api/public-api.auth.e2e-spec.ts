import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import { UserQueryRepositorySQL } from '../../../src/admin-api/user/infrastructure/repositories/user.query-repository-sql';
import request from 'supertest';
import { UserCreateDto } from '../../../src/admin-api/user/api/models/user-api.dto';
import { newTestUsersCreateDTO } from '../../../test-utils/create-user.test-factory-function';
import { User } from '../../../libs/db/mongoose/schemes/user.entity';

describe('public api e2e auth tests', () => {
  let app: INestApplication;
  let httpServer: any;
  let usersQueryRepositorySQL: UserQueryRepositorySQL;
  const newUserCredentials: UserCreateDto = newTestUsersCreateDTO.user1;
  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    usersQueryRepositorySQL = moduleRef.get<UserQueryRepositorySQL>(
      UserQueryRepositorySQL,
    );
    app = moduleRef.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('public api POST(/auth/registration) registration new user', async () => {
    await request(httpServer)
      .post('/auth/registration')
      .send(newUserCredentials)
      .expect(204);
  });

  it('public api POST(/auth/registration-confirmation) confirm created user email', async () => {
    const createdUser: User =
      await usersQueryRepositorySQL.findUserWithSimilarLoginOrEmail({
        email: newUserCredentials.email,
        login: newUserCredentials.login,
      });
    const emailConfirmationCode: string =
      createdUser.emailConfirmation.confirmationCode;
    await request(httpServer)
      .post('/auth/registration-confirmation')
      .send({ code: emailConfirmationCode })
      .expect(204);
  });
});
