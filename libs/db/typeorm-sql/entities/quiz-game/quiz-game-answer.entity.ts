import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuizGameQuestionSQLEntity } from './quiz-game-question.entity';

@Entity({ name: 'quiz_game_answer_typeorm' })
export class QuizGameAnswerSQLEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  questionId: number;

  @Column({ type: 'jsonb' })
  answer: string | number;

  @ManyToOne(() => QuizGameQuestionSQLEntity, (question) => question.answers, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  @JoinColumn({ name: 'questionId' })
  question: QuizGameQuestionSQLEntity;
}
