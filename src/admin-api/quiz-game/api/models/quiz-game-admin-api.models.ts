export type QuizGameAdminApiViewModel = {
  id: string;
  body: string;
  correctAnswers: (string | number)[] | null;
  published: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export type QuizGameAdminApiPaginationViewModel = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: QuizGameAdminApiViewModel[];
};
