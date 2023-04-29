import { registerDecorator, ValidationOptions } from 'class-validator';

export const IsStringWithTrim = (validationOptions?: ValidationOptions) => {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsStringWithTrim',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any): Promise<boolean> | boolean {
          if (typeof value === 'string') {
            if (value.trim().length === 0) {
              return false;
            } else {
              return true;
            }
          } else {
            return false;
          }
        },
      },
    });
  };
};
