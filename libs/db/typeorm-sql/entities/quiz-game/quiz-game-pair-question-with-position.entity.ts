import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'quiz_game_pair_questions_typeorm' })
export class QuizGamePairQuestionWithPositionSQLEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  quizGamePairId: string;

  @Column({ type: 'integer' })
  questionId: number;

  /* позиция вопроса в массиве вопросов к квиз паре.
   * нужно чтобы знать очередность вопросов в игре
   * и в случае чего восстановить ее заново */
  @Column({ type: 'integer' })
  questionPosition: number;
}
