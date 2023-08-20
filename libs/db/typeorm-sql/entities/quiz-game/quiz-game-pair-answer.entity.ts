import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Relation,
} from 'typeorm';
import { UserSQLEntity } from '../users/user-sql.entity';
import { QuizGamePairSQLEntity } from './quiz-game-pair.entity';

@Entity({ name: 'quiz_game_pair_answers_typeorm' })
export class QuizGamePairAnswerSQLEntity {
  @PrimaryColumn({ type: 'integer' })
  quizGamePairId: number;

  @PrimaryColumn({ type: 'integer' })
  userId: number;

  @Column({ type: 'varchar', length: 10 })
  answerStatus: 'Correct' | 'Incorrect ';

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
}
