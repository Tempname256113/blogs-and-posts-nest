import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { UserSQLEntity } from '../users/user-sql.entity';
import { QuizGameQuestionSQLEntity } from './quiz-game-question.entity';
import { QuizGamePairAnswerSQLEntity } from './quiz-game-pair-answer.entity';

@Entity({ name: 'quiz_game_pair_typeorm' })
export class QuizGamePairSQLEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer' })
  player1Id: number;

  @Column({ nullable: true, type: 'integer' })
  player2Id: number | null;

  @Column({ type: 'integer' })
  player1Score: number;

  @Column({ type: 'integer' })
  player2Score: number;

  @Column({ type: 'varchar', length: 19 })
  status: 'PendingSecondPlayer' | 'Active' | 'Finished';

  @Column({ type: 'timestamp' })
  pairCreatedDate: string;

  @Column({ type: 'timestamp', nullable: true })
  startGameDate: string | null;

  @Column({ type: 'timestamp', nullable: true })
  finishGameDate: string | null;

  @ManyToOne(() => UserSQLEntity, (player1) => player1.quizGamesAsPlayer1, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  @JoinColumn({ name: 'player1Id' })
  player1: Relation<UserSQLEntity>;

  @ManyToOne(() => UserSQLEntity, (player2) => player2.quizGamesAsPlayer2, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  @JoinColumn({ name: 'player2Id' })
  player2: Relation<UserSQLEntity>;

  @ManyToMany(
    () => QuizGameQuestionSQLEntity,
    (question) => question.quizGamePairsWithQuestion,
    { onDelete: 'CASCADE', cascade: true },
  )
  @JoinTable({
    name: 'quiz_game_pair_questions_typeorm',
    joinColumn: { name: 'quizGamePairId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'questionId', referencedColumnName: 'id' },
  })
  questions: Relation<QuizGameQuestionSQLEntity[]>;

  @OneToMany(() => QuizGamePairAnswerSQLEntity, (answer) => answer.quizGamePair)
  answers: Relation<QuizGamePairAnswerSQLEntity[]>;
}
