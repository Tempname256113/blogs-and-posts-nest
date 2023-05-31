import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IExtendedExpressRequest } from '../generic-models/extended-request.model';

/*декоратор для использования мета информации прикрепленной к объекту запроса библиотекой passportjs (req.user)
 * принимает дженерик - ожидаемый тип данных прикрепленный к объекту запроса passportjs.
 * например, если был использована jwt стратегия, то passportjs при успешной аутентификации прикрепит к объекту запроса
 * payload расшифрованного access jwt токена, следовательно нужно передать тип ожидаемого payloadAccessToken  */
export const PassportjsReqDataDecorator = createParamDecorator(
  <T>(data: any, ctx: ExecutionContext): T => {
    const request: IExtendedExpressRequest<T> = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
