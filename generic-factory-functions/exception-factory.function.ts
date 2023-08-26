import {
  BadRequestErrorModelType,
  ErrorObjType,
} from '../generic-models/bad-request.error-model';

/* функция для возвращения ошибок со статусом 400 (bad request)
 * нужно передать массив со свойствами которые будут в ответе в
 * свойствах field */
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
