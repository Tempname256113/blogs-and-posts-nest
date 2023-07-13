import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BloggerRepositoryBlogType } from '../../../src/blogger-api/blog/infrastructure/repositories/models/blogger-repository.models';
import { BloggerBlogQueryRepositorySQL } from '../../../src/blogger-api/blog/infrastructure/repositories/blog-blogger.query-repository-sql';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsValidBlogIdConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly blogQueryRepositorySQL: BloggerBlogQueryRepositorySQL,
  ) {}
  async validate(
    blogId: string,
    validationArguments?: ValidationArguments,
  ): Promise<boolean> {
    if (!Number(blogId)) return false;
    const foundedBlog: BloggerRepositoryBlogType | null =
      await this.blogQueryRepositorySQL.getBlogByIdInternalUse(blogId);
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
