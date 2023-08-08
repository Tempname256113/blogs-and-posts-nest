import { BadRequestException, ValidationError } from '@nestjs/common';
import { ErrorObjType } from '../generic-models/bad-request.error-model';

/* этот pipe используется библиотекой class-validator на глобальном уровне
 чтобы мапить возвращаемые в случаях ошибок объекты
 * в нужный вид */
export function validationPipeExceptionFactoryFunction(
  errors: ValidationError[],
): void {
  const mappedErrors: ErrorObjType[] = errors.map((validationError) => {
    const field: string = validationError.property;
    const message = 'invalid data';
    return {
      message,
      field,
    };
  });
  throw new BadRequestException({ errorsMessages: mappedErrors });
}
