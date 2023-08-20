import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { QuizGameQuestionSQLEntity } from './quiz-game-question.entity';
import { QuizGamePairSQLEntity } from './quiz-game-pair.entity';

@Entity({ name: 'quiz_game_answer_typeorm' })
export class QuizGameAnswerSQLEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  questionId: number;

  @Column({ type: 'jsonb', nullable: true })
  answers: string[] | null;

  @OneToOne(() => QuizGameQuestionSQLEntity, (question) => question.answer, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  @JoinColumn({ name: 'questionId' })
  question: QuizGameQuestionSQLEntity;

  @ManyToMany(() => QuizGamePairSQLEntity, (quizPair) => quizPair.answers)
  quizGamePairsWithAnswer: Relation<QuizGamePairSQLEntity[]>;
}
