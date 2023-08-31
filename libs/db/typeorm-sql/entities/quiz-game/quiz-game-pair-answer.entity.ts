import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { UserSQLEntity } from '../users/user-sql.entity';
import { QuizGamePairSQLEntity } from './quiz-game-pair.entity';
import { QuizGameQuestionSQLEntity } from './quiz-game-question.entity';

@Entity({ name: 'quiz_game_pair_answers_typeorm' })
export class QuizGamePairAnswerSQLEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  quizGamePairId: number;

  @Column({ type: 'integer' })
  userId: number;

  @Column({ type: 'integer' })
  questionId: number;

  @Column({ type: 'varchar', length: 10 })
  answerStatus: 'Correct' | 'Incorrect';

  @Column({ type: 'timestamp' })
  addedAt: string;

  @ManyToOne(() => UserSQLEntity, (user) => user.quizGameAnswers, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  @JoinColumn({ name: 'userId' })
  user: Relation<UserSQLEntity>;

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
}
