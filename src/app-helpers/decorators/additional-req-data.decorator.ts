import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IExtendedExpressRequest } from '../../app-models/extended-request.model';

export const AdditionalReqDataDecorator = createParamDecorator(
  <T>(data: any, ctx: ExecutionContext): T => {
    const request: IExtendedExpressRequest<T> = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
