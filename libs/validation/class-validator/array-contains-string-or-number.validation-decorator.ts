import { registerDecorator, ValidationOptions } from 'class-validator';

export function ArrayContainsStringOrNumber(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'ArrayContainsStringOrNumber',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: (string | number)[]): boolean {
          if (!Array.isArray(value)) return false;
          for (const elem of value) {
            if (typeof elem === 'string' || typeof elem === 'number') {
              continue;
            } else {
              return false;
            }
          }
          return true;
        },
      },
    });
  };
}
