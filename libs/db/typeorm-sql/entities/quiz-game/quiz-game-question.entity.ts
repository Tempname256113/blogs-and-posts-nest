import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { QuizGameAnswerSQLEntity } from './quiz-game-answer.entity';

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

  @OneToOne(() => QuizGameAnswerSQLEntity, (answer) => answer.question)
  answer: QuizGameAnswerSQLEntity;
}
