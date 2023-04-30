import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Blog,
  BlogSchema,
} from '../../product-module/product-domain/blog.entity';
import { Model } from 'mongoose';
import { Request } from 'express';
import { IPostApiCreateUpdateDTO } from '../../product-module/post/post-api/post-api-models/post-api.dto';

/* кастомный перехватчик запроса. нужен для проверки на валидность входящего в теле запроса blogId (существует он вообще или нет)
 * если он не существует, то заменяет строку в теле запроса request.body.blogId на null. получается request.body.blogId === null
 * сделано для того чтобы class-validator смог понять что входящие данные не валидны (не равно string) и отправить ошибку на клиент */
@Injectable()
export class BlogIdValidateInterceptor implements NestInterceptor {
  constructor(
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
  ) {}
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const ctx = context.switchToHttp();
    const request: Request = ctx.getRequest();
    const requestBody: IPostApiCreateUpdateDTO = request.body;
    const blogId: string = requestBody.blogId;
    const foundedBlog: Blog | null = await this.BlogModel.findOne({
      id: blogId,
    }).lean();
    if (!foundedBlog) {
      requestBody.blogId = null;
    }
    return next.handle();
  }
}
