import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'quiz_game_pair_questions_typeorm' })
export class QuizGamePairQuestionsSQLEntity {
  @PrimaryColumn({ type: 'integer' })
  quizGamePairId: number;

  @PrimaryColumn({ type: 'integer' })
  questionId: number;

  /* позиция вопроса в массиве вопросов к квиз паре.
   * нужно чтобы знать очередность вопросов в игре
   * и в случае чего восстановить ее заново */
  @Column({ type: 'integer' })
  questionPosition: number;
}
