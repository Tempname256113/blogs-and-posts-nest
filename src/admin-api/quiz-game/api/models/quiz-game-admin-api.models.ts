export type QuizGameAdminApiViewModel = {
  id: string;
  body: string;
  correctAnswers: (string | number)[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type QuizGameAdminApiPaginationViewModel = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: QuizGameAdminApiViewModel;
};
