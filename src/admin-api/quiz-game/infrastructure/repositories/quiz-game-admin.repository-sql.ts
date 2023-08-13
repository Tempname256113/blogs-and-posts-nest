import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { QuizGameQuestionSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-question.entity';
import { DataSource, DeleteResult, Repository, UpdateResult } from 'typeorm';
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
    newAnswer.answers = newQuestionAnswers;

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

  async deleteQuestion(questionId: string): Promise<boolean> {
    const deleteResult: DeleteResult = await this.quizGameQuestionEntity.delete(
      questionId,
    );
    return deleteResult.affected > 0;
  }

  async updateQuestion({
    body,
    correctAnswers,
    questionId,
  }: {
    body: string;
    correctAnswers?: (string | number)[];
    questionId: string;
  }): Promise<void> {
    await this.dataSource.manager.transaction(
      async (transactionEntityManager) => {
        const quizGameQuestionEntity: Repository<QuizGameQuestionSQLEntity> =
          transactionEntityManager.getRepository<QuizGameQuestionSQLEntity>(
            QuizGameQuestionSQLEntity,
          );
        const quizGameAnswerEntity: Repository<QuizGameAnswerSQLEntity> =
          transactionEntityManager.getRepository<QuizGameAnswerSQLEntity>(
            QuizGameAnswerSQLEntity,
          );
        await quizGameQuestionEntity.update(questionId, {
          body,
          updatedAt: new Date().toISOString(),
        });
        await quizGameAnswerEntity.update(
          { questionId: Number(questionId) },
          { answers: correctAnswers ? correctAnswers : [] },
        );
      },
    );
  }

  async publishQuestion({
    questionId,
    publish,
  }: {
    questionId: string;
    publish: boolean;
  }): Promise<boolean> {
    const updateResult: UpdateResult = await this.quizGameQuestionEntity.update(
      questionId,
      {
        published: publish,
      },
    );
    return updateResult.affected === 1;
  }
}
