import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { QuizGameQuestionSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-question.entity';
import { DataSource, Repository } from 'typeorm';
import { QuizGameAnswerSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-answer.entity';
import { QuizGameAdminApiViewModel } from '../../api/models/quiz-game-admin-api.models';
import { CreateQuizGameQuestionAdminApiDTO } from '../../api/models/quiz-game-admin-api.dto';

@Injectable()
export class AdminQuizGameRepositorySQL {
  constructor(
    @InjectRepository(QuizGameQuestionSQLEntity)
    private readonly quizGameQuestionEntity: Repository<QuizGameQuestionSQLEntity>,
    @InjectRepository(QuizGameAnswerSQLEntity)
    private readonly quizGameAnswerEntity: Repository<QuizGameAnswerSQLEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async createQuestion({
    body: newQuestionBody,
    correctAnswers: newQuestionAnswers,
  }: CreateQuizGameQuestionAdminApiDTO): Promise<QuizGameAdminApiViewModel> {
    const newQuestion: QuizGameQuestionSQLEntity =
      new QuizGameQuestionSQLEntity();
    newQuestion.body = newQuestionBody;
    newQuestion.published = false;
    newQuestion.createdAt = new Date().toISOString();
    newQuestion.updatedAt = null;

    const newAnswer: QuizGameAnswerSQLEntity = new QuizGameAnswerSQLEntity();
    newAnswer.question = newQuestion;
    newAnswer.answer = newQuestionAnswers;

    let newCreatedQuestion: QuizGameQuestionSQLEntity;

    await this.dataSource.manager.transaction(async (entityManager) => {
      newCreatedQuestion = await entityManager.save(newQuestion);
      await entityManager.save(newAnswer);
    });

    return {
      id: String(newCreatedQuestion.id),
      body: newCreatedQuestion.body,
      correctAnswers: newQuestionAnswers,
      published: newCreatedQuestion.published,
      createdAt: newCreatedQuestion.createdAt,
      updatedAt: newCreatedQuestion.updatedAt,
    };
  }
}
