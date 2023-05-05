import { Request } from 'express';

export interface IExtendedExpressRequest<T> extends Request {
  user: T;
}
