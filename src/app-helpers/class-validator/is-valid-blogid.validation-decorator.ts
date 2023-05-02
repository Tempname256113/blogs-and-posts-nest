import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { InjectModel } from '@nestjs/mongoose';
import {
  Blog,
  BlogSchema,
} from '../../product-module/product-domain/blog.entity';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsValidBlogIdConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
  ) {}
  async validate(
    blogId: string,
    validationArguments?: ValidationArguments,
  ): Promise<boolean> {
    if (typeof blogId !== 'string') {
      return false;
    }
    const foundedBlog: Blog | null = await this.BlogModel.findOne({
      id: blogId,
    }).lean();
    return !!foundedBlog;
  }
}

export function IsValidBlogId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidBlogIdConstraint,
    });
  };
}
