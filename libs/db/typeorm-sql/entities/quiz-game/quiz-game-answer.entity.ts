import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
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
  answer: (string | number)[];

  @OneToOne(() => QuizGameQuestionSQLEntity, (question) => question.answers, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  @JoinColumn({ name: 'questionId' })
  question: QuizGameQuestionSQLEntity;
}
