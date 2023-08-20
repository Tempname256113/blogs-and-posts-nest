export type QuizGameQuestionAdminApiViewModel = {
  id: string;
  body: string;
  correctAnswers: string[] | null;
  published: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export type QuizGameAdminApiPaginationViewModel = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: QuizGameQuestionAdminApiViewModel[];
};
