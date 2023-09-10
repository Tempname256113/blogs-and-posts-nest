export type QuizGamePublicApiPlayerAnswerViewModel = {
  questionId: string;
  answerStatus: 'Correct' | 'Incorrect';
  addedAt: string;
};

export type QuizGamePublicApiPlayerViewModel = {
  id: string;
  login: string;
};

export type QuizGamePublicApiQuestionViewModel = {
  id: string;
  body: string;
};

export type QuizGamePublicApiViewModel = {
  id: string;
  firstPlayerProgress: {
    answers: QuizGamePublicApiPlayerAnswerViewModel[];
    player: QuizGamePublicApiPlayerViewModel;
    score: number;
  };
  secondPlayerProgress: {
    answers: QuizGamePublicApiPlayerAnswerViewModel[];
    player: QuizGamePublicApiPlayerViewModel;
    score: number;
  } | null;
  questions: QuizGamePublicApiQuestionViewModel[] | null;
  status: 'PendingSecondPlayer' | 'Active' | 'Finished';
  pairCreatedDate: string;
  startGameDate: string | null;
  finishGameDate: string | null;
};

export type QuizGamePublicApiPaginationViewModel = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: QuizGamePublicApiViewModel[];
};

export type QuizGamePublicApiUserStatisticViewModel = {
  sumScore: number;
  avgScores: number;
  gamesCount: number;
  winsCount: number;
  lossesCount: number;
  drawsCount: number;
};
