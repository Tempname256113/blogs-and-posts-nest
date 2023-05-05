import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/* получает из запроса user agent */
export const ClientDeviceTitle = createParamDecorator(
  (data: any, ctx: ExecutionContext): string => {
    const request: Request = ctx.switchToHttp().getRequest();
    return request.headers['user-agent'];
  },
);
