import { registerDecorator, ValidationOptions } from 'class-validator';

export const IsLike = (validationOptions?: ValidationOptions) => {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsLike',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any): Promise<boolean> | boolean {
          if (value !== 'Like' && value !== 'Dislike' && value !== 'None') {
            return false;
          } else {
            return true;
          }
        },
      },
    });
  };
};
