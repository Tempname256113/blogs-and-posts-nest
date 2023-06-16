import request, { Response } from 'supertest';
import { LoginUserDTO } from '../src/public-api/auth/api/models/auth-api.dto';

// public api login user POST(/auth/login)
export const loginUserTestFunction = async ({
  httpServer,
  loginUserDTO,
}: {
  httpServer: any;
  loginUserDTO: LoginUserDTO;
}): Promise<Response> => {
  return request(httpServer).post('/auth/login').send({
    loginOrEmail: loginUserDTO.loginOrEmail,
    password: loginUserDTO.password,
  });
};
