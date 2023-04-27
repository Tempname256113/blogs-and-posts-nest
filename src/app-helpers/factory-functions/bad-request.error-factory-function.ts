import { BadRequestErrorModelType } from '../../app-models/bad-request.error-model';

type errorObject = {
  message: string;
  field: string;
};

export const badRequestErrorFactoryFunction = (
  errorFields: string[],
): BadRequestErrorModelType => {
  const mappedErrorsArray: errorObject[] = errorFields.map((field) => {
    const errorObj: errorObject = {
      message: 'invalid data',
      field,
    };
    return errorObj;
  });
  return {
    errorsMessages: mappedErrorsArray,
  };
};