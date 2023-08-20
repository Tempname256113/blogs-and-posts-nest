export type QuizGamePublicApiPlayerAnswerViewModel = {
  questionId: string;
  answerStatus: 'Correct' | 'Incorrect ';
  addedAt: string;
};

export type QuizGamePublicApiPlayerViewModel = {
  id: string;
  login: string;
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
  questions: { id: string; body: string }[] | null;
  status: 'PendingSecondPlayer' | 'Active' | 'Finished';
  pairCreatedDate: string;
  startGameDate: string | null;
  finishGameDate: string | null;
};
