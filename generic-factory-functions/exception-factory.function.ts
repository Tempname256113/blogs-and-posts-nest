import {
  BadRequestErrorModelType,
  ErrorObjType,
} from '../generic-models/bad-request.error-model';

export const exceptionFactoryFunction = (
  errorFields: string[],
): BadRequestErrorModelType => {
  const mappedErrorsArray: ErrorObjType[] = errorFields.map((field) => {
    const errorObj: ErrorObjType = {
      message: 'invalid data',
      field,
    };
    return errorObj;
  });
  return {
    errorsMessages: mappedErrorsArray,
  };
};
