import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Relation,
} from 'typeorm';
import { QuizGamePairSQLEntity } from './quiz-game-pair.entity';
import { QuizGameQuestionSQLEntity } from './quiz-game-question.entity';
import { UserSQLEntity } from '../users/user-sql.entity';

@Entity({ name: 'quiz_game_pair_answers_typeorm' })
export class QuizGamePairAnswersSQLEntity {
  @PrimaryColumn({ type: 'integer' })
  quizGamePairId: number;

  @PrimaryColumn({ type: 'integer' })
  questionId: number;

  @PrimaryColumn({ type: 'integer' })
  userId: number;

  @Column({ type: 'varchar', length: 10 })
  answerStatus: 'Correct' | 'Incorrect ';

  @Column({ type: 'timestamp' })
  addedAt: string;

  @ManyToOne(() => QuizGamePairSQLEntity, (quizPair) => quizPair.answers, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  @JoinColumn({ name: 'quizGamePairId' })
  quizGamePair: Relation<QuizGamePairSQLEntity>;

  @ManyToOne(
    () => QuizGameQuestionSQLEntity,
    (question) => question.quizGamePairAnswers,
    { onDelete: 'CASCADE', cascade: true },
  )
  @JoinColumn({ name: 'questionId' })
  question: Relation<QuizGameQuestionSQLEntity>;

  @ManyToOne(() => UserSQLEntity, (user) => user.quizGameAnswers, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  @JoinColumn({ name: 'userId' })
  user: Relation<UserSQLEntity>;
}
