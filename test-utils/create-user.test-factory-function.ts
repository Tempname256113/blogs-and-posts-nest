import { UserApiCreateDto } from '../src/admin-api/user/api/models/user-api.dto';
import request, { Response } from 'supertest';

// credentials for new users
export const newTestUsersCreateDTO: {
  user1: UserApiCreateDto;
  user2: UserApiCreateDto;
  user3: UserApiCreateDto;
} = {
  user1: {
    login: 'temp123',
    password: 'temp123',
    email: 'temp256113@mail.ru',
  },
  user2: {
    login: 'sashok228',
    password: 'sashok228',
    email: 'temp256113@mail.ru',
  },
  user3: {
    login: 'kek123',
    password: 'kek123',
    email: 'temp256113@mail.ru',
  },
};

// create new user through admin api POST(/sa/users)
export const createUserTestFactoryFunction = async ({
  httpServer,
  userCreateDTO,
}: {
  httpServer: any;
  userCreateDTO: UserApiCreateDto;
}): Promise<Response> => {
  const basicAuthLogin = 'admin';
  const basicAuthPass = 'qwerty';
  return request(httpServer)
    .post('/sa/users')
    .auth(basicAuthLogin, basicAuthPass, { type: 'basic' })
    .send(userCreateDTO);
};
