import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { QuizGamePairSQLEntity } from './quiz-game-pair.entity';

@Entity({ name: 'quiz_game_question_typeorm' })
export class QuizGameQuestionSQLEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 500 })
  body: string;

  @Column({ type: 'boolean', default: false })
  published: boolean;

  @Column({ type: 'timestamp' })
  createdAt: string;

  @Column({ type: 'timestamp', nullable: true, default: null })
  updatedAt: string | null;

  @Column({ type: 'jsonb', nullable: true })
  answers: string[] | null;

  @ManyToMany(() => QuizGamePairSQLEntity, (quizPair) => quizPair.questions, {
    onDelete: 'CASCADE',
  })
  quizGamePairsWithQuestion: Relation<QuizGamePairSQLEntity[]>;
}
