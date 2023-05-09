import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/*декоратор для извлечения access token из request.headers
 * при успешном извлечении возвращает токен (отделяет строку Bearer от токена)
 * если поле authorization пустое или там нет строки Bearer то возвращает null*/
export const AccessToken = createParamDecorator(
  (data: any, ctx: ExecutionContext): string | null => {
    const request: Request = ctx.switchToHttp().getRequest();
    if (!request.headers.authorization) return null;
    const splitAuthorizationToken: string[] =
      request.headers.authorization.split(' ');
    if (splitAuthorizationToken[0] !== 'Bearer') {
      return null;
    } else if (splitAuthorizationToken[0] === 'Bearer') {
      return splitAuthorizationToken[1];
    }
  },
);
