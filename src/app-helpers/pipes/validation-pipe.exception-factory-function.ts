import { BadRequestException, ValidationError } from '@nestjs/common';

export function validationPipeExceptionFactoryFunction(
  errors: ValidationError[],
) {
  const mappedErrors: { message: string; field: string }[] = errors.map(
    (validationError) => {
      const field: string = validationError.property;
      const message = 'invalid data';
      return {
        message,
        field,
      };
    },
  );
  throw new BadRequestException({ errorsMessages: mappedErrors });
}
