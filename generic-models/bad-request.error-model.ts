export type BadRequestErrorModelType = {
  errorsMessages: ErrorObjType[];
};

export type ErrorObjType = {
  message: string;
  field: string;
};
