import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const Cookies = createParamDecorator(
  (cookieProperty: string, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    return cookieProperty ? request.cookies?.[cookieProperty] : request.cookies;
  },
);
